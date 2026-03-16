import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const SSH = require('node-ssh').NodeSSH;
    const ssh = new SSH();

    await ssh.connect({
      host: process.env.DEPLOY_SSH_HOST,
      username: process.env.DEPLOY_SSH_USER,
      password: process.env.DEPLOY_SSH_PASSWORD,
    });

    const diagnostics: any = {};

    // Check if nginx exists
    const nginxCheck = await ssh.execCommand('ls -la /var/log/nginx/ 2>&1 | head -20');
    diagnostics.nginxLogs = {
      path: '/var/log/nginx/',
      output: nginxCheck.stdout,
      error: nginxCheck.stderr,
    };

    // Check users directory
    const usersCheck = await ssh.execCommand('ls -la /var/www/users/ 2>&1 | head -20');
    diagnostics.usersDir = {
      path: '/var/www/users/',
      output: usersCheck.stdout,
      error: usersCheck.stderr,
    };

    // Check first user site structure
    const siteCheck = await ssh.execCommand('find /var/www/users -type f -name "*.log" 2>/dev/null | head -20');
    diagnostics.logFiles = {
      description: 'All .log files found',
      output: siteCheck.stdout,
    };

    // List all sites
    const sitesCheck = await ssh.execCommand('find /var/www/users -type d -name sites 2>/dev/null');
    diagnostics.sites = {
      description: 'All site directories',
      output: sitesCheck.stdout,
    };

    // Check if there's a logs directory anywhere
    const logsCheck = await ssh.execCommand('find /var/www -type d -name logs 2>/dev/null | head -20');
    diagnostics.logsDirectories = {
      description: 'All "logs" directories',
      output: logsCheck.stdout,
    };

    ssh.dispose();

    return NextResponse.json(diagnostics);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message, details: error },
      { status: 500 }
    );
  }
}
