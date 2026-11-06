export const statuses = ['New', 'Contacted', 'Active', 'Closed'];

export function addCustomer(customers, input, id) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (!name || name.length > 80) throw new Error('Enter a name with 1 to 80 characters.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Enter a valid email.');
  if (customers.some(customer => customer.email === email)) throw new Error('That email already exists.');
  return [...customers, { id, name, email, status: 'New' }];
}

export function searchCustomers(customers, query) {
  const term = query.trim().toLowerCase();
  return customers.filter(({ name, email }) => [name, email].some(value => value.toLowerCase().includes(term)));
}

export function updateStatus(customers, id, status) {
  if (!statuses.includes(status)) throw new Error('Invalid customer status.');
  if (!customers.some(customer => customer.id === id)) throw new Error('Customer not found.');
  return customers.map(customer => customer.id === id ? { ...customer, status } : customer);
}
