/**
 * Formata número de telefone para o padrão brasileiro
 * Exemplo: 5581987780566 -> (81) 98778-0566
 * Exemplo: 8187780566 -> (81) 98778-0566 (adiciona o 9 automaticamente)
 */
export const formatarTelefone = (numero: string): string => {
  if (!numero) return '';
  
  // Remove tudo que não é número
  let apenasNumeros = numero.replace(/\D/g, '');
  
  // Remove código do país se houver (55 para Brasil)
  if (apenasNumeros.startsWith('55') && apenasNumeros.length > 11) {
    apenasNumeros = apenasNumeros.substring(2);
  }
  
  // Se tiver menos de 10 dígitos, retorna como está
  if (apenasNumeros.length < 10) {
    return numero;
  }
  
  // Extrai DDD (2 primeiros dígitos)
  const ddd = apenasNumeros.substring(0, 2);
  let resto = apenasNumeros.substring(2);
  
  // Para números brasileiros: SEMPRE adiciona o 9 se não tiver
  if (resto.length === 8) {
    // Número tem 8 dígitos após DDD, adiciona o 9
    resto = '9' + resto;
  }
  
  // Formato padrão brasileiro: (DD) 9XXXX-XXXX
  if (resto.length === 9 && resto.startsWith('9')) {
    const parte1 = resto.substring(0, 5); // 9XXXX
    const parte2 = resto.substring(5);     // XXXX
    return `(${ddd}) ${parte1}-${parte2}`;
  }
  
  // Se não seguir o padrão esperado, retorna formatação simples
  return `(${ddd}) ${resto}`;
};

/**
 * Verifica se um nome é um número de telefone
 */
export const isNumeroTelefone = (nome: string): boolean => {
  if (!nome) return false;
  
  // Remove tudo que não é número
  const apenasNumeros = nome.replace(/\D/g, '');
  
  // Se tem 10 ou 11 dígitos, provavelmente é telefone
  return apenasNumeros.length >= 10 && apenasNumeros === nome;
};
