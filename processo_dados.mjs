#!/usr/bin/env node
/**
 * Processa dados reais dos CSVs e gera arquivos limpos + script SQL
 * Versão melhorada com melhor parsing de CSV
 */

import fs from 'fs';

// Parser CSV melhorado
function parseCSVLines(content) {
  const lines = content.split('\n');
  
  // Remove linhas totalmente vazias e encontra o header
  let headerIndex = -1;
  const dataLines = [];
  let headers = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Pula linhas vazias
    
    if (line.includes('Medico') && line.includes('Ativo')) {
      headerIndex = i;
      headers = line.split(',').map(h => h.trim());
      // Continua para pegar os dados
      continue;
    }
    
    if (headerIndex !== -1) {
      dataLines.push(line);
    }
  }
  
  // Parse dos dados
  const data = [];
  for (const line of dataLines) {
    // Split simples por vírgula (funciona para maioria dos casos)
    const parts = line.split(',');
    
    if (parts.length >= headers.length) {
      const row = {};
      for (let i = 0; i < headers.length; i++) {
        row[headers[i]] = (parts[i] || '').trim().replace(/^"|"$/g, '');
      }
      data.push(row);
    }
  }
  
  return data;
}

console.log('='.repeat(70));
console.log('PROCESSANDO DADOS REAIS - MÉDICOS');
console.log('='.repeat(70));

// Lê medicos.csv
let medicosContent;
try {
  medicosContent = fs.readFileSync('data/medicos.csv.csv', 'utf-8');
} catch (e) {
  console.error(`✗ Erro ao ler medicos.csv: ${e.message}`);
  process.exit(1);
}

// Parse medicos com melhor tratamento
const medicosLines = medicosContent.split('\n');
const medicosAtivos = [];
let medicoHeaderFound = false;

for (const line of medicosLines) {
  const trimmed = line.trim();
  if (!trimmed) continue;
  
  if (trimmed.includes('NOME') && trimmed.includes('ATIVO')) {
    medicoHeaderFound = true;
    continue;
  }
  
  if (medicoHeaderFound) {
    const parts = trimmed.split(',');
    if (parts.length >= 2) {
      const nome = parts[0].trim().replace(/^"|"$/g, '');
      const ativo = parts[1].trim().toUpperCase();
      if (nome && ativo === 'TRUE') {
        medicosAtivos.push(nome);
      }
    }
  }
}

console.log(`✓ Total de médicos ativos: ${medicosAtivos.length}`);
console.log(`✓ Nomes: ${medicosAtivos.join(', ')}`);

console.log('\n' + '='.repeat(70));
console.log('PROCESSANDO DADOS REAIS - CÓDIGOS AGHU');
console.log('='.repeat(70));

// Lê codigos.csv
let codigosContent;
try {
  codigosContent = fs.readFileSync('data/codigos.csv.csv', 'utf-8');
} catch (e) {
  console.error(`✗ Erro ao ler codigos.csv: ${e.message}`);
  process.exit(1);
}

// Parse codigos com melhor tratamento
const codigosLines = codigosContent.split('\n');
const codigosAtivos = [];
const medicoUnicos = new Set();
let codigoHeaderFound = false;
let codigoHeaderData = [];

for (let i = 0; i < codigosLines.length; i++) {
  const trimmed = codigosLines[i].trim();
  if (!trimmed) continue;
  
  // Encontra o header
  if (trimmed.includes('Medico') && trimmed.includes('Ativo')) {
    codigoHeaderFound = true;
    codigoHeaderData = trimmed.split(',').map(h => h.trim());
    continue;
  }
  
  if (codigoHeaderFound) {
    // Parse linha de dados
    const parts = trimmed.split(',');
    
    if (parts.length >= 7) {
      const medico = parts[0].trim().replace(/^"|"$/g, '');
      const modalidade = parts[1].trim().replace(/^"|"$/g, '');
      const exame = parts[2].trim().replace(/^"|"$/g, '');
      const codigoAghu = parts[3].trim().replace(/^"|"$/g, '');
      const preparo = parts[4].trim().replace(/^"|"$/g, '');
      const observacao = parts[5].trim().replace(/^"|"$/g, '');
      const ativo = parts[6].trim().toUpperCase();
      
      // Filtra: Ativo != 'FALSE' e possui codigo_aghu
      if (ativo !== 'FALSE' && codigoAghu && medico) {
        codigosAtivos.push({
          Medico: medico,
          Modalidade: modalidade,
          Exames: exame,
          Codigo_aghu: codigoAghu,
          Preparo: preparo,
          Observacao: observacao,
          Ativo: 'TRUE'
        });
        medicoUnicos.add(medico);
      }
    }
  }
}

console.log(`✓ Total de registros com Ativo=TRUE: ${codigosAtivos.length}`);
console.log(`✓ Médicos únicos em codigos: ${medicoUnicos.size}`);
console.log(`✓ Primeiras 5 linhas de dados:`);
codigosAtivos.slice(0, 5).forEach((c, i) => {
  console.log(`  ${i+1}. ${c.Medico} - ${c.Modalidade} (${c.Codigo_aghu})`);
});

console.log('\n' + '='.repeat(70));
console.log('VALIDAÇÃO DE INTEGRIDADE');
console.log('='.repeat(70));

const medicosSet = new Set(medicosAtivos);
const medicoNaoEncontrados = [...medicoUnicos].filter(m => !medicosSet.has(m));

if (medicoNaoEncontrados.length > 0) {
  console.log(`⚠ AVISO: ${medicoNaoEncontrados.length} médicos em codigos.csv não encontrados em medicos.csv:`);
  medicoNaoEncontrados.slice(0, 10).forEach(m => {
    console.log(`  - ${m}`);
  });
  if (medicoNaoEncontrados.length > 10) {
    console.log(`  ... e ${medicoNaoEncontrados.length - 10} outros`);
  }
} else {
  console.log('✓ Todos os médicos em codigos.csv existem em medicos.csv');
}

console.log('\n' + '='.repeat(70));
console.log('GERANDO ARQUIVOS DE SAÍDA');
console.log('='.repeat(70));

// 1. Arquivo limpo de médicos
try {
  let medicosCsv = 'NOME,ATIVO\n';
  medicosAtivos.sort().forEach(medico => {
    medicosCsv += `"${medico.replace(/"/g, '""')}",TRUE\n`;
  });
  fs.writeFileSync('medicos_limpo.csv', medicosCsv, 'utf-8');
  console.log(`✓ medicos_limpo.csv gerado (${medicosAtivos.length} registros)`);
} catch (e) {
  console.error(`✗ Erro ao gerar medicos_limpo.csv: ${e.message}`);
}

// 2. Arquivo limpo de códigos
try {
  let codigosCsv = 'Medico,Modalidade,Exames,Codigo_aghu,Preparo,Observacao,Ativo\n';
  codigosAtivos.forEach(codigo => {
    const medico = (codigo.Medico || '').trim().replace(/"/g, '""');
    const modalidade = (codigo.Modalidade || '').trim().replace(/"/g, '""');
    const exames = (codigo.Exames || '').trim().replace(/"/g, '""');
    const codigoAghu = (codigo.Codigo_aghu || '').trim().replace(/"/g, '""');
    const preparo = (codigo.Preparo || '').trim().replace(/"/g, '""');
    const observacao = (codigo.Observacao || '').trim().replace(/"/g, '""');
    
    codigosCsv += `"${medico}","${modalidade}","${exames}","${codigoAghu}","${preparo}","${observacao}",TRUE\n`;
  });
  fs.writeFileSync('codigos_aghu_limpo.csv', codigosCsv, 'utf-8');
  console.log(`✓ codigos_aghu_limpo.csv gerado (${codigosAtivos.length} registros)`);
} catch (e) {
  console.error(`✗ Erro ao gerar codigos_aghu_limpo.csv: ${e.message}`);
}

// 3. Gerar SQL
try {
  const medicosOrdenados = [...medicosSet].sort();
  
  let sqlContent = `-- =====================================================================
-- SEED: Médicos e Códigos AGHU - UDI (Unidade de Imagem Diagnóstica)
-- Gerado: ${new Date().toISOString()}
-- Dados: Processados dos arquivos CSV reais da unidade
-- Total de Médicos: ${medicosAtivos.length}
-- Total de Códigos AGHU: ${codigosAtivos.length}
-- =====================================================================

-- Limpeza (opcional - remova comentário para usar em ambiente fresh)
-- DELETE FROM public.codigos_aghu WHERE ativo = true AND medico_id IN (SELECT id FROM public.medicos WHERE nome ILIKE '%');
-- DELETE FROM public.medicos WHERE ativo = true;

-- =====================================================================
-- INSERT MÉDICOS (${medicosAtivos.length} registros)
-- =====================================================================
INSERT INTO public.medicos (nome, ativo, created_at, updated_at) 
VALUES
`;
  
  const medicosValues = medicosOrdenados.map(medico => {
    const nomeEscaped = medico.replace(/'/g, "''");
    return `  ('${nomeEscaped}', true, now(), now())`;
  });
  
  sqlContent += medicosValues.join(',\n') + '\n';
  sqlContent += `ON CONFLICT (nome) DO UPDATE SET ativo = true, updated_at = now();

`;
  
  sqlContent += `-- =====================================================================
-- INSERT CÓDIGOS AGHU (${codigosAtivos.length} registros)
-- =====================================================================
-- Usando WITH CTE para mapear médicos aos IDs
WITH medicos_map AS (
  SELECT id, nome FROM public.medicos WHERE ativo = true
)
INSERT INTO public.codigos_aghu 
  (medico_id, modalidade, exame, codigo_aghu, preparo, observacoes, ativo, created_at, updated_at)
SELECT
  mm.id,
  c.modalidade,
  c.exame,
  c.codigo_aghu,
  NULLIF(c.preparo, ''),
  NULLIF(c.observacao, ''),
  true,
  now(),
  now()
FROM (
  VALUES
`;
  
  const codigosValues = codigosAtivos.map((codigo, idx) => {
    const medicoEscaped = codigo.Medico.replace(/'/g, "''");
    const modalidadeEscaped = (codigo.Modalidade || '').replace(/'/g, "''");
    const exameEscaped = (codigo.Exames || '').replace(/'/g, "''");
    const codigoEscaped = (codigo.Codigo_aghu || '').replace(/'/g, "''");
    const preparoEscaped = (codigo.Preparo || '').replace(/'/g, "''");
    const observacaoEscaped = (codigo.Observacao || '').replace(/'/g, "''");
    
    return `    ('${medicoEscaped}', '${modalidadeEscaped}', '${exameEscaped}', '${codigoEscaped}', '${preparoEscaped}', '${observacaoEscaped}')`;
  });
  
  sqlContent += codigosValues.join(',\n') + `
) AS c(medico, modalidade, exame, codigo_aghu, preparo, observacao)
JOIN medicos_map mm ON mm.nome = c.medico
ON CONFLICT (medico_id, codigo_aghu) DO UPDATE 
SET modalidade = EXCLUDED.modalidade, 
    exame = EXCLUDED.exame, 
    ativo = true,
    updated_at = now();

`;
  
  sqlContent += `-- =====================================================================
-- VERIFICAÇÃO DE CARGA
-- =====================================================================
SELECT 
  'MÉDICOS ATIVOS' as tipo,
  COUNT(*) as total
FROM public.medicos
WHERE ativo = true
UNION ALL
SELECT 
  'CÓDIGOS AGHU ATIVOS' as tipo,
  COUNT(*) as total
FROM public.codigos_aghu
WHERE ativo = true
ORDER BY total DESC;
`;
  
  // Cria diretório se não existir
  if (!fs.existsSync('supabase')) {
    fs.mkdirSync('supabase', { recursive: true });
  }
  
  fs.writeFileSync('supabase/seed_medicos_codigos_udi.sql', sqlContent, 'utf-8');
  console.log(`✓ supabase/seed_medicos_codigos_udi.sql gerado`);
  console.log(`  - Médicos: ${medicosAtivos.length}`);
  console.log(`  - Códigos AGHU: ${codigosAtivos.length}`);
} catch (e) {
  console.error(`✗ Erro ao gerar SQL: ${e.message}`);
  console.error(e.stack);
}

console.log('\n' + '='.repeat(70));
console.log('✓ PROCESSAMENTO CONCLUÍDO COM SUCESSO');
console.log('='.repeat(70));
console.log('\nArquivos gerados:');
console.log('  1. medicos_limpo.csv - Lista de médicos ativos');
console.log('  2. codigos_aghu_limpo.csv - Códigos AGHU com modalidades');
console.log('  3. supabase/seed_medicos_codigos_udi.sql - Script SQL para Supabase');
console.log('\n📝 Próximo passo: Execute o arquivo SQL em seu database Supabase!');
