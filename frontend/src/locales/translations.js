export const translations = {
  fr: {
    // Header
    'header.title': 'ADR3Club Bot Dashboard',
    'header.administrator': 'Administrateur',
    'header.changePassword': 'Changer le mot de passe',
    'header.logout': 'Déconnexion',

    // Dashboard
    'dashboard.title': 'Tableau de bord',
    'dashboard.subtitle': 'Surveillez et gérez vos processus PM2',
    'dashboard.processes': 'Processus PM2',
    'dashboard.refresh': 'Rafraîchir',
    'dashboard.loading': 'Chargement des processus...',
    'dashboard.error': 'Échec du chargement des processus',
    'dashboard.noProcesses': 'Aucun processus trouvé',

    // Process Table
    'table.id': 'ID',
    'table.name': 'Nom',
    'table.status': 'Statut',
    'table.uptime': 'Uptime',
    'table.cpu': 'CPU',
    'table.memory': 'Mémoire',
    'table.restarts': 'Redémarrages',
    'table.actions': 'Actions',

    // Process Actions
    'actions.restart': 'Redémarrer',
    'actions.stop': 'Arrêter',
    'actions.start': 'Démarrer',
    'actions.viewLogs': 'Voir les logs',

    // Process Status
    'status.online': 'En ligne',
    'status.stopped': 'Arrêté',
    'status.errored': 'Erreur',
    'status.launching': 'Démarrage',

    // Logs Viewer
    'logs.title': 'Logs',
    'logs.connected': 'Connecté',
    'logs.disconnected': 'Déconnecté',
    'logs.clear': 'Effacer les logs',
    'logs.export': 'Exporter',
    'logs.close': 'Fermer',
    'logs.waiting': 'En attente de logs...',
    'logs.connecting': 'Connexion...',
    'logs.lines': 'lignes',
    'logs.autoScroll': 'Défilement auto',
    'logs.on': 'ACTIVÉ',
    'logs.off': 'DÉSACTIVÉ',

    // Login
    'login.title': 'Connexion',
    'login.username': 'Nom d\'utilisateur',
    'login.password': 'Mot de passe',
    'login.signIn': 'Se connecter',
    'login.signingIn': 'Connexion...',
    'login.poweredBy': 'Propulsé par ADR3Club',

    // Change Password
    'changePassword.title': 'Changer le mot de passe',
    'changePassword.current': 'Mot de passe actuel',
    'changePassword.new': 'Nouveau mot de passe',
    'changePassword.confirm': 'Confirmer le mot de passe',
    'changePassword.submit': 'Changer le mot de passe',
    'changePassword.submitting': 'Changement...',
    'changePassword.cancel': 'Annuler',
    'changePassword.success': 'Mot de passe changé avec succès!',
    'changePassword.error.mismatch': 'Les mots de passe ne correspondent pas',
    'changePassword.error.length': 'Le mot de passe doit contenir au moins 6 caractères',

    // Confirm Dialog
    'confirm.restart.title': 'Redémarrer le processus',
    'confirm.restart.message': 'Êtes-vous sûr de vouloir redémarrer',
    'confirm.restart.button': 'Redémarrer',
    'confirm.stop.title': 'Arrêter le processus',
    'confirm.stop.message': 'Êtes-vous sûr de vouloir arrêter',
    'confirm.stop.button': 'Arrêter',
    'confirm.logout.title': 'Déconnexion',
    'confirm.logout.message': 'Êtes-vous sûr de vouloir vous déconnecter?',
    'confirm.logout.button': 'Se déconnecter',
    'confirm.cancel': 'Annuler',

    // Session
    'session.expired': 'Votre session a expiré. Veuillez vous reconnecter.',
    'session.timeout': 'Session expirée',

    // Stats
    'stats.totalProcesses': 'Total Processus',
    'stats.online': 'En ligne',
    'stats.offline': 'Hors ligne',
    'stats.avgCPU': 'CPU Moyen',
    'stats.totalRAM': 'RAM Totale',

    // Search and Filter
    'search.placeholder': 'Rechercher par nom...',
    'filter.title': 'Filtres',
    'filter.status': 'Statut',
    'filter.all': 'Tous',
  },
  en: {
    // Header
    'header.title': 'ADR3Club Bot Dashboard',
    'header.administrator': 'Administrator',
    'header.changePassword': 'Change password',
    'header.logout': 'Logout',

    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.subtitle': 'Monitor and manage your PM2 processes',
    'dashboard.processes': 'PM2 Processes',
    'dashboard.refresh': 'Refresh',
    'dashboard.loading': 'Loading processes...',
    'dashboard.error': 'Failed to load processes',
    'dashboard.noProcesses': 'No processes found',

    // Process Table
    'table.id': 'ID',
    'table.name': 'Name',
    'table.status': 'Status',
    'table.uptime': 'Uptime',
    'table.cpu': 'CPU',
    'table.memory': 'Memory',
    'table.restarts': 'Restarts',
    'table.actions': 'Actions',

    // Process Actions
    'actions.restart': 'Restart',
    'actions.stop': 'Stop',
    'actions.start': 'Start',
    'actions.viewLogs': 'View logs',

    // Process Status
    'status.online': 'Online',
    'status.stopped': 'Stopped',
    'status.errored': 'Errored',
    'status.launching': 'Launching',

    // Logs Viewer
    'logs.title': 'Logs',
    'logs.connected': 'Connected',
    'logs.disconnected': 'Disconnected',
    'logs.clear': 'Clear logs',
    'logs.export': 'Export',
    'logs.close': 'Close',
    'logs.waiting': 'Waiting for logs...',
    'logs.connecting': 'Connecting...',
    'logs.lines': 'lines',
    'logs.autoScroll': 'Auto-scroll',
    'logs.on': 'ON',
    'logs.off': 'OFF',

    // Login
    'login.title': 'Login',
    'login.username': 'Username',
    'login.password': 'Password',
    'login.signIn': 'Sign In',
    'login.signingIn': 'Signing in...',
    'login.poweredBy': 'Powered by ADR3Club',

    // Change Password
    'changePassword.title': 'Change Password',
    'changePassword.current': 'Current Password',
    'changePassword.new': 'New Password',
    'changePassword.confirm': 'Confirm Password',
    'changePassword.submit': 'Change Password',
    'changePassword.submitting': 'Changing...',
    'changePassword.cancel': 'Cancel',
    'changePassword.success': 'Password changed successfully!',
    'changePassword.error.mismatch': 'Passwords do not match',
    'changePassword.error.length': 'Password must be at least 6 characters',

    // Confirm Dialog
    'confirm.restart.title': 'Restart Process',
    'confirm.restart.message': 'Are you sure you want to restart',
    'confirm.restart.button': 'Restart',
    'confirm.stop.title': 'Stop Process',
    'confirm.stop.message': 'Are you sure you want to stop',
    'confirm.stop.button': 'Stop',
    'confirm.logout.title': 'Logout',
    'confirm.logout.message': 'Are you sure you want to logout?',
    'confirm.logout.button': 'Logout',
    'confirm.cancel': 'Cancel',

    // Session
    'session.expired': 'Your session has expired. Please login again.',
    'session.timeout': 'Session Expired',

    // Stats
    'stats.totalProcesses': 'Total Processes',
    'stats.online': 'Online',
    'stats.offline': 'Offline',
    'stats.avgCPU': 'Avg CPU',
    'stats.totalRAM': 'Total RAM',

    // Search and Filter
    'search.placeholder': 'Search by name...',
    'filter.title': 'Filters',
    'filter.status': 'Status',
    'filter.all': 'All',
  }
};
