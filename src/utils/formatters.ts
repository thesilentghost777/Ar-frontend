// Formatters utilitaires

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' FCFA';
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const getInitials = (nom: string, prenom: string): string => {
  const firstNom = nom.charAt(0).toUpperCase();
  const firstPrenom = prenom.charAt(0).toUpperCase();
  return `${firstPrenom}${firstNom}`;
};

export const getNiveauLabel = (niveau: number): string => {
  switch (niveau) {
    case -1:
      return 'Nouveau membre';
    case 0:
      return 'Niveau 0';
    case 1:
      return 'Niveau 1';
    case 2:
      return 'Niveau 2';
    case 3:
      return 'Niveau 3 (VIP)';
    default:
      return `Niveau ${niveau}`;
  }
};

export const getFraisStatusLabel = (status: string): string => {
  switch (status) {
    case 'paye':
      return 'Payé';
    case 'non_paye':
      return 'Non payé';
    case 'dispense':
      return 'Dispensé';
    default:
      return status;
  }
};

export const getTypePermisLabel = (type: string): string => {
  switch (type) {
    case 'permis_a':
      return 'Permis A (Moto)';
    case 'permis_b':
      return 'Permis B (Voiture)';
    case 'permis_t':
      return 'Permis T (Tracteur)';
    default:
      return type;
  }
};

export const getTypeCoursLabel = (type: string): string => {
  switch (type) {
    case 'en_ligne':
      return 'En ligne';
    case 'presentiel':
      return 'En présentiel (Samedi)';
    case 'les_deux':
      return 'Les deux';
    default:
      return type;
  }
};

export const maskPhone = (phone: string): string => {
  if (phone.length < 6) return phone;
  const start = phone.substring(0, 3);
  const end = phone.substring(phone.length - 2);
  return `${start}****${end}`;
};
