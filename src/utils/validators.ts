// Validation utilitaires

export const validatePhone = (phone: string): boolean => {
  // Format camerounais: 6XXXXXXXX (9 chiffres commençant par 6)
  const phoneRegex = /^6[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validatePassword = (password: string): { valid: boolean; message: string } => {
  if (password.length < 6) {
    return { valid: false, message: 'Le mot de passe doit contenir au moins 6 caractères' };
  }
  return { valid: true, message: '' };
};

export const validatePasswordMatch = (password: string, confirmation: string): boolean => {
  return password === confirmation;
};

export const validateAmount = (amount: number, minimum: number = 200): { valid: boolean; message: string } => {
  if (isNaN(amount) || amount <= 0) {
    return { valid: false, message: 'Veuillez entrer un montant valide' };
  }
  if (amount < minimum) {
    return { valid: false, message: `Le montant minimum est de ${minimum} FCFA` };
  }
  return { valid: true, message: '' };
};

export const validateRequired = (value: string, fieldName: string): { valid: boolean; message: string } => {
  if (!value || value.trim() === '') {
    return { valid: false, message: `${fieldName} est requis` };
  }
  return { valid: true, message: '' };
};

export const validateDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const validateAge = (dateString: string, minAge: number = 16): { valid: boolean; message: string } => {
  const birthDate = new Date(dateString);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  if (age < minAge) {
    return { valid: false, message: `Vous devez avoir au moins ${minAge} ans` };
  }
  
  return { valid: true, message: '' };
};
