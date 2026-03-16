'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

export default function AcceptInvitationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [invitationData, setInvitationData] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const { firestore: db } = initializeFirebase();
  const auth = getAuth();

  const token = searchParams.get('token');
  const projectId = searchParams.get('projectId');

  useEffect(() => {
    if (!token || !projectId) {
      setError('Lien d\'invitation invalide');
      setLoading(false);
      return;
    }

    // Récupérer les détails de l'invitation
    const fetchInvitation = async () => {
      try {
        // Chercher l'invitation dans tous les utilisateurs
        // Pour simplifier, on va chercher dans une collection d'invitations publiques
        const inviteRef = doc(db, 'publicInvitations', token);
        const inviteDoc = await getDoc(inviteRef);

        if (!inviteDoc.exists()) {
          setError('Lien d\'invitation expiré ou invalide');
          setLoading(false);
          return;
        }

        const data = inviteDoc.data();

        // Vérifier que le lien n'a pas expiré
        if (data.acceptanceCount >= data.maxAcceptances) {
          setError('Cette invitation a déjà atteint sa limite');
          setLoading(false);
          return;
        }

        setInvitationData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching invitation:', err);
        setError('Une erreur est survenue');
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [token, projectId, db]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      // Valider le formulaire
      if (!formData.name || !formData.email || !formData.password) {
        setError('Veuillez remplir tous les champs');
        setSubmitting(false);
        return;
      }

      if (formData.password !== formData.confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        setSubmitting(false);
        return;
      }

      if (formData.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères');
        setSubmitting(false);
        return;
      }

      // Créer l'utilisateur
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const newUserId = userCredential.user.uid;

      // Créer le document utilisateur
      const userRef = doc(db, 'users', newUserId);
      await updateDoc(userRef, {
        name: formData.name,
        email: formData.email,
        createdAt: Timestamp.now(),
        subscription: {
          plan: 'free',
          createdAt: Timestamp.now(),
        },
      });

      // Ajouter le nouvel utilisateur comme collaborateur
      const collaboratorsRef = doc(
        db,
        'users',
        invitationData.ownerId,
        'sites',
        invitationData.siteId,
        'collaborators',
        'list'
      );

      await updateDoc(collaboratorsRef, {
        list: arrayUnion({
          userId: newUserId,
          email: formData.email,
          name: formData.name,
          status: 'active',
          role: 'collaborator',
          joinedAt: Timestamp.now(),
        }),
      });

      // Incrémenter le compteur d'acceptations
      if (invitationData && token) {
        const inviteRef = doc(db, 'publicInvitations', token);
        await updateDoc(inviteRef, {
          acceptanceCount: invitationData.acceptanceCount + 1,
          updatedAt: Timestamp.now(),
        });
      }

      // Rediriger vers le projet
      router.push(`/sites/${invitationData.siteId}`);
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Cet email est déjà utilisé');
      } else if (err.code === 'auth/invalid-email') {
        setError('Email invalide');
      } else {
        setError('Une erreur est survenue lors de la création du compte');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de l\'invitation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">{error}</h3>
            <button
              onClick={() => router.push('/')}
              className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-center mb-2">Rejoindre {invitationData?.siteName}</h1>
        <p className="text-center text-gray-600 mb-6">
          Créez votre compte pour rejoindre ce projet
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom complet
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="john@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmer le mot de passe
            </label>
            <input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-md transition"
          >
            {submitting ? 'Création du compte...' : 'Créer un compte et rejoindre'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-4">
          Vous avez déjà un compte?{' '}
          <a href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
            Se connecter
          </a>
        </p>
      </div>
    </div>
  );
}
