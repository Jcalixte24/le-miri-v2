/* Bascule de suspension d'abonnement.
   SUSPENDED=true  -> tout le site public redirige vers /suspendu.html (sauf /admin)
   SUSPENDED=false -> site normal
   Pour réactiver : passer SUSPENDED à false ci-dessous. Ne pas retirer ce fichier
   ni les balises <script src="/suspend-guard.js"></script> des pages, elles ne
   font rien quand SUSPENDED=false. */
(function () {
  var SUSPENDED = true;
  if (!SUSPENDED) return;

  var path = location.pathname;
  if (path.indexOf('/admin') === 0) return;
  if (path.indexOf('/suspendu.html') !== -1) return;

  location.replace('/suspendu.html');
})();
