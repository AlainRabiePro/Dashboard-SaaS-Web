export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <h1 className="text-4xl font-bold text-white mb-4">Politique de Confidentialité</h1>
        <p className="text-slate-400 mb-8">Dernière mise à jour: Mars 2024</p>

        <div className="prose prose-invert max-w-none">
          <div className="space-y-8">
            <section>
              <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
              <p className="text-slate-300 mb-4">
                DomainHub ("nous", "notre", "nos") opère le site Web et l'application DomainHub.
                Cette page vous informe de nos politiques concernant la collecte, l'utilisation et la divulgation de données personnelles
                lorsque vous utilisez notre service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">2. Informations que Nous Collectons</h2>
              <p className="text-slate-300 mb-4">Nous collectons plusieurs types d'informations :</p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 mb-4">
                <li>Informations de compte : email, nom, mot de passe</li>
                <li>Informations de domaine : domaines achetés, transferts</li>
                <li>Informations de paiement : via Stripe (nous ne stockons pas les données de carte)</li>
                <li>Informations de navigation : IP, navigateur, pages visitées</li>
                <li>Informations de communication : messages de support, retours</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">3. Comment Nous Utilisons Vos Informations</h2>
              <p className="text-slate-300 mb-4">Nous utilisons les informations collectées pour :</p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 mb-4">
                <li>Fournir et maintenir notre service</li>
                <li>Traiter vos transactions</li>
                <li>Vous envoyer des mises à jour et des communications</li>
                <li>Répondre à vos demandes de support</li>
                <li>Améliorer notre service</li>
                <li>Détecter et prévenir la fraude</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">4. Sécurité des Données</h2>
              <p className="text-slate-300 mb-4">
                La sécurité de vos données nous est importante. Nous utilisons le chiffrement SSL/TLS pour protéger les informations
                en transit. Cependant, aucune méthode de transmission Internet n'est 100% sûre.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">5. Partage des Données</h2>
              <p className="text-slate-300 mb-4">
                Nous partageons vos informations uniquement avec :
              </p>
              <ul className="list-disc list-inside text-slate-300 space-y-2 mb-4">
                <li>Les registraires de domaines (IONOS, etc.) pour l'enregistrement</li>
                <li>Stripe pour le traitement des paiements</li>
                <li>Firebase pour l'authentification et l'hébergement</li>
                <li>Les autorités légales si requis par la loi</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">6. Vos Droits</h2>
              <p className="text-slate-300 mb-4">
                Vous avez le droit d'accéder, de corriger ou de supprimer vos données personnelles. 
                Pour exercer ces droits, contactez-nous à privacy@domainub.com
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">7. Cookies</h2>
              <p className="text-slate-300 mb-4">
                Nous utilisons des cookies pour améliorer votre expérience utilisateur. Vous pouvez contrôler l'utilisation
                des cookies dans vos paramètres de navigateur.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">8. Modifications de cette Politique</h2>
              <p className="text-slate-300 mb-4">
                Nous pouvons mettre à jour cette politique de temps en temps. Nous vous notifierons de tout changement important
                en postant la nouvelle politique sur cette page.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-white mb-4">9. Contact</h2>
              <p className="text-slate-300 mb-4">
                Si vous avez des questions concernant cette politique de confidentialité, veuillez nous contacter à :
                <br />
                Email: privacy@domainub.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
