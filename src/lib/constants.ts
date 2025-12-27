
export const XP_PER_SAVED_BRL = 0.1; // 1 EP for every R$10 saved
export const XP_LOSS_PER_MISSED_MONTH = 50;
export const BATTLE_PASS_GOAL = 10000;


export const LEVELS = [
  { name: 'Iniciante', xpRequired: 0, level: 1 },
  { name: 'Poupador Bronze', xpRequired: 100, level: 2 },
  { name: 'Poupador Prata', xpRequired: 250, level: 3 },
  { name: 'Poupador Ouro', xpRequired: 500, level: 4 },
  { name: 'Investidor Junior', xpRequired: 800, level: 5 },
  { name: 'Investidor Pleno', xpRequired: 1200, level: 6 },
  { name: 'Investidor Sênior', xpRequired: 1700, level: 7 },
  { name: 'Mestre das Finanças', xpRequired: 2500, level: 8 },
  { name: 'Mago Financeiro', xpRequired: 5000, level: 9 },
  { name: 'Lenda da Riqueza', xpRequired: 10000, level: 10 },
];

// Add up to 100 levels
// For the "battle pass" system, these levels now represent tiers within a single 10k cycle.
// Level 10 means completing the cycle.
for (let i = 11; i <= 100; i++) {
  LEVELS.push({
    name: `Lenda Nível ${i}`,
    xpRequired: 10000 + (i - 10) * 2000, // This part is less relevant now but kept for structure
    level: i,
  });
}


export const CATEGORIES = [
    { value: 'Groceries', label: 'Supermercado' },
    { value: 'Dining', label: 'Restaurantes' },
    { value: 'Entertainment', label: 'Entretenimento' },
    { value: 'Utilities', label: 'Contas' },
    { value: 'Rent', label: 'Aluguel' },
    { value: 'Salary', label: 'Salário' },
    { value: 'Investments', label: 'Investimentos' },
    { value: 'Shopping', label: 'Compras' },
    { value: 'Transport', label: 'Transporte' },
    { value: 'Savings', label: 'Cofrinho' },
    { value: 'Other', label: 'Outros' }
];

export const COMMON_DESCRIPTIONS = [
    { value: 'Internet', label: 'Internet' },
    { value: 'Energia', label: 'Energia' },
    { value: 'Agua', label: 'Água' },
    { value: 'Faculdade', label: 'Faculdade' },
    { value: 'Gasolina', label: 'Gasolina' },
    { value: 'Supermercado', label: 'Supermercado' },
    { value: 'Salário', label: 'Salário' },
    { value: 'Depósito Cofrinho', label: 'Depósito Cofrinho' },
    { value: 'Outra', label: 'Outra' },
];
