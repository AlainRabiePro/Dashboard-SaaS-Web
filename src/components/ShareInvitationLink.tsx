'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { sendInvitationEmailViaResend } from '@/lib/email-service';
import { CollaboratorsPaywall } from './CollaboratorsPaywall';

interface ShareInvitationLinkProps {
  projectId: string;
  projectName: string;
}

export function ShareInvitationLink({ projectId, projectName }: ShareInvitationLinkProps) {
  const { user } = useAuth();
  const [link, setLink] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>('');
  const [invitationData, setInvitationData] = useState<any>(null);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [requiresAddon, setRequiresAddon] = useState(false);
  const [addonPrice, setAddonPrice] = useState(2);

  useEffect(() => {
    fetchInvitationLink();
  }, [projectId, user?.uid]);

  const fetchInvitationLink = async () => {
    if (!user?.uid) return;

    try {
      setLoading(true);
      const response = await fetch('/api/collaborators/invite-link', {
        method: 'GET',
        headers: {
          'x-user-id': user.uid,
          'x-project-id': projectId,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Créer un nouveau lien
          await createNewLink();
          return;
        }
        if (response.status === 403) {
          // Add-on non activé
          const data = await response.json();
          setRequiresAddon(true);
          setAddonPrice(data.addonPrice || 2);
          setError(data.message);
          setLoading(false);
          return;
        }
        throw new Error('Failed to fetch invitation link');
      }

      const data = await response.json();
      setInvitationData(data);
      setLink(data.link);
      setError('');
    } catch (err) {
      console.error('Error fetching invitation link:', err);
      setError('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const createNewLink = async () => {
    if (!user?.uid) return;

    try {
      const response = await fetch('/api/collaborators/invite-link', {
        method: 'POST',
        headers: {
          'x-user-id': user.uid,
          'x-project-id': projectId,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        if (response.status === 403) {
          // Add-on non activé
          setRequiresAddon(true);
          setAddonPrice(data.addonPrice || 2);
          setError(data.message);
        } else {
          setError('Une erreur est survenue lors de la création du lien');
        }
      } else {
        const data = await response.json();
        setInvitationData(data);
        setLink(data.link);
        setError('');
        setRequiresAddon(false);
      }
    } catch (err) {
      console.error('Error creating invitation link:', err);
      setError('Une erreur est survenue lors de la création du lien');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const sendViaEmail = async () => {
    if (!recipientEmail) {
      setEmailError('Veuillez entrer une adresse email');
      return;
    }

    setSendingEmail(true);
    setEmailError('');
    setEmailSuccess(false);

    try {
      await sendInvitationEmailViaResend(
        recipientEmail,
        user?.email || 'support@example.com',
        projectName,
        link
      );
      setEmailSuccess(true);
      setRecipientEmail('');
      setTimeout(() => setEmailSuccess(false), 3000);
    } catch (err) {
      console.error('Error sending email:', err);
      setEmailError('Erreur lors de l\'envoi du mail');
    } finally {
      setSendingEmail(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-10 bg-gray-200 rounded mb-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    if (requiresAddon) {
      return (
        <CollaboratorsPaywall 
          addonPrice={addonPrice}
          onSubscribe={() => {
            // Rediriger vers la page de souscription
            window.location.href = '/billing/addons/collaborators';
          }}
        />
      );
    }

    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <p className="text-red-700 text-sm">{error}</p>
        <button
          onClick={createNewLink}
          className="mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statut des invitations */}
      {invitationData && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {invitationData.used}/{invitationData.limit} personnes invitées
              </p>
              <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${(invitationData.used / invitationData.limit) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            {invitationData.isExpired && (
              <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded">
                Limite atteinte
              </span>
            )}
          </div>
        </div>
      )}

      {/* Lien d'invitation */}
      {!invitationData?.isExpired && (
        <>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lien d'invitation partageable
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={link}
                readOnly
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition"
              >
                {copied ? '✓ Copié' : 'Copier'}
              </button>
            </div>
          </div>

          {/* Envoyer par email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Envoyer par email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => {
                  setRecipientEmail(e.target.value);
                  setEmailError('');
                }}
                placeholder="email@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <button
                onClick={sendViaEmail}
                disabled={sendingEmail}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 text-sm font-medium transition"
              >
                {sendingEmail ? 'Envoi...' : 'Envoyer'}
              </button>
            </div>
            {emailError && <p className="mt-2 text-sm text-red-600">{emailError}</p>}
            {emailSuccess && (
              <p className="mt-2 text-sm text-green-600">Email envoyé avec succès!</p>
            )}
          </div>
        </>
      )}

      {invitationData?.isExpired && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            Limite d'invitations atteinte pour ce projet
          </p>
          <p className="text-sm text-yellow-700 mt-1">
            {invitationData.limit} personnes ont déjà rejoint ce projet.
          </p>
        </div>
      )}
    </div>
  );
}
