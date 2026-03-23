export function getUserRole(user) {
  const role = user?.user_metadata?.role;
  return typeof role === 'string' ? role : 'borrower';
}

export function getRoleHomeRoute(role) {
  if (role === 'super_admin') return '/super_admin';
  if (role === 'admin') return '/admin';
  if (role === 'lender') return '/lender';
  if (role === 'broker') return '/broker';
  return '/dashboard';
}
