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

/**
 * ✅ Bug #16: Formata data para o fuso horário do Brasil (UTC-3)
 * Evita problemas de conversão de timezone
 */
export const formatarDataBrasil = (dataISO: string): string => {
  if (!dataISO) return '';
  
  // Parse da data ISO
  const data = new Date(dataISO);
  
  // Formatar para pt-BR
  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'America/Sao_Paulo'
  });
};

/**
 * ✅ Bug #16: Formata hora para o fuso horário do Brasil (UTC-3)
 */
export const formatarHoraBrasil = (dataISO: string): string => {
  if (!dataISO) return '';
  
  const data = new Date(dataISO);
  
  return data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
};

/**
 * ✅ Bug #16: Formata data e hora completa para o Brasil
 */
export const formatarDataHoraBrasil = (dataISO: string): string => {
  if (!dataISO) return '';
  
  const data = new Date(dataISO);
  
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Sao_Paulo'
  });
};

/**
 * ✅ Bug #16: Converte data brasileira (dd/mm/aaaa) para formato MySQL (yyyy-mm-dd)
 * SEM conversão de timezone
 */
export const dataBrasilParaMySQL = (dataBrasil: string, hora: string = '00:00:00'): string => {
  const [dia, mes, ano] = dataBrasil.split('/');
  return `${ano}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')} ${hora}`;
};
