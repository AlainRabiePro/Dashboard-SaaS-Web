import { NextRequest, NextResponse } from 'next/server';
import { addProjectLog, addCommandOutput } from '@/lib/logs-store';

export async function POST(request: NextRequest) {
  console.log('[CONSOLE EXECUTE] Début requête');
  
  try {
    const userId = request.headers.get('x-user-id');
    const projectId = request.headers.get('x-project-id');
    const projectName = request.headers.get('x-project-name');
    const domain = request.headers.get('x-domain');
    const body = await request.json();
    const { command } = body;

    console.log('[CONSOLE EXECUTE] userId:', userId, 'projectId:', projectId, 'command:', command);

    if (!userId || !projectId || !command) {
      console.log('[CONSOLE EXECUTE] Paramètres manquants');
      return NextResponse.json(
        { error: 'Paramètres manquants' },
        { status: 400 }
      );
    }

    // Utiliser les données passées depuis le client au lieu de les récupérer depuis Firebase
    let domainToUse = domain || '';
    if (!domainToUse && projectName) {
      domainToUse = projectName;
    }

    // Éviter les fallbacks génériques
    if (!domainToUse || domainToUse === 'Pas de domaine' || domainToUse === 'pas-de-domaine') {
      return NextResponse.json(
        { error: 'Domaine du projet non configuré. Veuillez ajouter un domaine au projet.' },
        { status: 400 }
      );
    }

    // Normaliser le domaine
    const normalizedDomain = domainToUse.toLowerCase().replace(/\./g, '-').replace(/\s+/g, '-');
    const projectPath = `/var/www/${normalizedDomain}`;

    console.log('[CONSOLE EXECUTE] projectPath:', projectPath);

    // Vérifier que les variables SSH sont configurées
    if (!process.env.DEPLOY_SSH_HOST || !process.env.DEPLOY_SSH_USER || !process.env.DEPLOY_SSH_PASSWORD) {
      console.log('[CONSOLE EXECUTE] Variables SSH manquantes');
      return NextResponse.json(
        { error: 'Variables SSH non configurées' },
        { status: 500 }
      );
    }

    // Exécuter la commande via SSH
    try {
      console.log('[CONSOLE EXECUTE] Connexion SSH...');
      const SSH = require('node-ssh').NodeSSH;
      const ssh = new SSH();

      await ssh.connect({
        host: process.env.DEPLOY_SSH_HOST,
        username: process.env.DEPLOY_SSH_USER,
        password: process.env.DEPLOY_SSH_PASSWORD,
      });

      console.log('[CONSOLE EXECUTE] SSH connecté');

      // Vérifier que le répertoire existe
      const checkDir = await ssh.execCommand(`test -d ${projectPath} && echo 'EXISTS' || echo 'NOT_FOUND'`);
      
      console.log('[CONSOLE EXECUTE] checkDir résultat:', checkDir.stdout.trim());

      if (checkDir.stdout.includes('NOT_FOUND')) {
        ssh.dispose();
        console.log('[CONSOLE EXECUTE] Répertoire n\'existe pas');
        return NextResponse.json(
          { error: `Le répertoire du projet n'existe pas: ${projectPath}` },
          { status: 404 }
        );
      }

      // Exécuter la commande dans le répertoire du projet
      console.log('[CONSOLE EXECUTE] Exécution commande:', command);
      
      // Ajouter un log de démarrage
      addProjectLog(projectId, {
        level: 'info',
        message: `Exécution: ${command}`,
        source: 'console-execute'
      });

      // Force npm à afficher la sortie directement (pas de buffering)
      const cmdWithOutput = command.startsWith('npm') 
        ? `${command} --loglevel=verbose --no-progress`
        : command;

      // Pour les commandes longues (run, build), ajouter un timeout de 30 secondes
      const isLongRunning = command.includes('run dev') || command.includes('run build');
      const timeout = isLongRunning ? 30000 : 300000; // 30s pour dev, 5min pour build/test

      const commandPromise = ssh.execCommand(`cd ${projectPath} && ${cmdWithOutput}`);
      
      // Implémenter un timeout manuel
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Command timeout')), timeout);
      });

      let commandResult: any;
      try {
        commandResult = await Promise.race([commandPromise, timeoutPromise]);
      } catch (timeoutError: any) {
        if (timeoutError.message === 'Command timeout') {
          // Timeout atteint - pour les commandes longues, c'est normal
          if (isLongRunning) {
            console.log('[CONSOLE EXECUTE] Timeout atteint (serveur lancé)');
            addProjectLog(projectId, {
              level: 'info',
              message: `Serveur lancé (timeout après ${timeout / 1000}s)`,
              source: 'console-execute'
            });
            
            ssh.dispose();
            return NextResponse.json({
              success: true,
              command,
              output: 'Serveur lancé avec succès',
              exitCode: 0,
              timedOut: true
            });
          } else {
            throw timeoutError;
          }
        }
        throw timeoutError;
      }

      console.log('[CONSOLE EXECUTE] Commande exécutée, code:', commandResult.code);

      // Sauvegarder les logs de sortie
      if (commandResult.stdout && commandResult.stdout.trim()) {
        addCommandOutput(projectId, commandResult.stdout, 'info');
      }
      if (commandResult.stderr && commandResult.stderr.trim()) {
        addCommandOutput(projectId, commandResult.stderr, 'error');
      }

      // Ajouter un log de fin
      addProjectLog(projectId, {
        level: commandResult.code === 0 ? 'info' : 'error',
        message: `Commande terminée avec le code ${commandResult.code}`,
        source: 'console-execute'
      });

      ssh.dispose();

      // Combiner stdout et stderr pour la réponse
      const combinedOutput = [
        commandResult.stdout || '',
        commandResult.stderr || ''
      ].filter(s => s.trim()).join('\n');

      // Retourner le résultat
      return NextResponse.json({
        success: commandResult.code === 0,
        command,
        output: combinedOutput,
        exitCode: commandResult.code,
        logsStored: !!(commandResult.stdout || commandResult.stderr)
      });
    } catch (sshError: any) {
      console.log('[CONSOLE EXECUTE] Erreur SSH:', sshError.message);
      return NextResponse.json(
        { error: `Erreur SSH: ${sshError.message}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.log('[CONSOLE EXECUTE] Erreur globale:', error.message);
    console.log('[CONSOLE EXECUTE] Stack:', error.stack);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l\'exécution de la commande' },
      { status: 500 }
    );
  }
}
