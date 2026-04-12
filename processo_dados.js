#!/usr/bin/env node
/**
 * Processa dados reais dos CSVs e gera arquivos limpos + script SQL
 * Requer: Node.js com suporte a fs e csv (se precisar instalá-lo)
 */

const fs = require('fs');
const path = require('path');

// Parser CSV simples (sem dependências externas)
function parseCSV(content) {
  const lines = content.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Parse com suporte a campos com aspas
    const row = {};
    let inQuotes = false;
    let field = '';
    let fieldIndex = 0;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        row[headers[fieldIndex]] = field.trim().replace(/^"|"$/g, '');
        field = '';
        fieldIndex++;
      } else {
        field += char;
      }
    }
    
    // Último campo
    if (fieldIndex < headers.length) {
      row[headers[fieldIndex]] = field.trim().replace(/^"|"$/g, '');
    }
    
    data.push(row);
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

const medicosData = parseCSV(medicosContent);
const medicosAtivos = medicosData
  .filter(m => m.ATIVO && m.ATIVO.trim().toUpperCase() === 'TRUE')
  .map(m => m.NOME.trim())
  .filter(m => m);

console.log(`✓ Total de médicos ativos: ${medicosAtivos.length}`);
console.log(`✓ Primeiros 5: ${medicosAtivos.slice(0, 5).join(', ')}`);

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

const codigosData = parseCSV(codigosContent);
const codigosAtivos = codigosData.filter(c => {
  const ativo = c.Ativo ? c.Ativo.trim().toUpperCase() : 'TRUE';
  return ativo !== 'FALSE' && c.Codigo_aghu && c.Codigo_aghu.trim();
});

const medicoUnicos = new Set(codigosAtivos.map(c => c.Medico.trim()));

console.log(`✓ Total de registros com Ativo=TRUE: ${codigosAtivos.length}`);
console.log(`✓ Médicos únicos em codigos: ${medicoUnicos.size}`);

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
-- Dados: Recebidos dos arquivos CSV reais
-- =====================================================================

-- Limpeza (opcional - remova comentário para usar em ambiente fresh)
-- DELETE FROM public.codigos_aghu WHERE modalidade IN ('ULTRASSOM', 'TOMOGRAFIA', 'RAIO - X', 'MAMOGRAFO');
-- DELETE FROM public.medicos WHERE id > 0;

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
  sqlContent += 'ON CONFLICT (nome) DO NOTHING;\n\n';
  
  sqlContent += `-- =====================================================================
-- INSERT CÓDIGOS AGHU (${codigosAtivos.length} registros)
-- =====================================================================
-- Usando WITH CTE para mapear médicos aos IDs
WITH medicos_map AS (
  SELECT id, nome FROM public.medicos WHERE nome IN (
`;
  
  const medicosList = medicosOrdenados.map(m => {
    const escaped = m.replace(/'/g, "''");
    return `    '${escaped}'`;
  }).join(',\n');
  
  sqlContent += medicosList + `
  )
)
INSERT INTO public.codigos_aghu 
  (medico_id, modalidade, exame, codigo_aghu, preparo, observacoes, ativo, created_at, updated_at)
VALUES
`;
  
  const codigosValues = codigosAtivos.map(codigo => {
    const medicoEscaped = (codigo.Medico || '').trim().replace(/'/g, "''");
    const modalidadeEscaped = (codigo.Modalidade || '').trim().replace(/'/g, "''");
    const exameEscaped = (codigo.Exames || '').trim().replace(/'/g, "''");
    const codigoEscaped = (codigo.Codigo_aghu || '').trim().replace(/'/g, "''");
    const preparoEscaped = (codigo.Preparo || '').trim().replace(/'/g, "''");
    const observacaoEscaped = (codigo.Observacao || '').trim().replace(/'/g, "''");
    
    const preparoSql = preparoEscaped ? `'${preparoEscaped}'` : 'NULL';
    const observacaoSql = observacaoEscaped ? `'${observacaoEscaped}'` : 'NULL';
    
    return `  ((SELECT id FROM medicos_map WHERE nome = '${medicoEscaped}'), '${modalidadeEscaped}', '${exameEscaped}', '${codigoEscaped}', ${preparoSql}, ${observacaoSql}, true, now(), now())`;
  });
  
  sqlContent += codigosValues.join(',\n') + '\n';
  sqlContent += 'ON CONFLICT (medico_id, codigo_aghu) DO NOTHING;\n\n';
  
  sqlContent += `-- =====================================================================
-- RELATÓRIO DE CARGA
-- =====================================================================
SELECT 
  'MEDICOS INSERIDOS' as tipo,
  COUNT(*) as total
FROM public.medicos
WHERE ativo = true
UNION ALL
SELECT 
  'CODIGOS AGHU INSERIDOS' as tipo,
  COUNT(*) as total
FROM public.codigos_aghu
WHERE ativo = true;
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
}

console.log('\n' + '='.repeat(70));
console.log('✓ PROCESSAMENTO CONCLUÍDO COM SUCESSO');
console.log('='.repeat(70));
console.log('\nArquivos gerados:');
console.log('  1. medicos_limpo.csv - Lista de médicos ativos');
console.log('  2. codigos_aghu_limpo.csv - Códigos AGHU com medicos');
console.log('  3. supabase/seed_medicos_codigos_udi.sql - Script SQL para Supabase');
console.log('\nPróximo passo: Execute o SQL em seu banco de dados!');
