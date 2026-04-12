#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Processa dados reais dos CSVs e gera arquivos limpos + script SQL
"""

import csv
import os
from collections import defaultdict
from typing import List, Dict, Set

# =====================================================================
# LEITURA E ANÁLISE DE MÉDICOS
# =====================================================================
print("=" * 70)
print("PROCESSANDO DADOS REAIS - MÉDICOS")
print("=" * 70)

medicos_ativos = []
try:
    with open('data/medicos.csv.csv', 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row and row.get('ATIVO', '').strip().upper() == 'TRUE':
                nome = row.get('NOME', '').strip()
                if nome:
                    medicos_ativos.append(nome)
    
    print(f"✓ Total de médicos ativos: {len(medicos_ativos)}")
    print(f"✓ Primeiros 5: {medicos_ativos[:5]}")
except Exception as e:
    print(f"✗ Erro ao ler medicos.csv: {e}")
    exit(1)

# =====================================================================
# LEITURA E ANÁLISE DE CÓDIGOS AGHU
# =====================================================================
print("\n" + "=" * 70)
print("PROCESSANDO DADOS REAIS - CÓDIGOS AGHU")
print("=" * 70)

codigos_dados = []  # Lista de dicts com todos os dados
codigos_count_active = 0
codigos_medicos = set()

try:
    with open('data/codigos.csv.csv', 'r', encoding='utf-8-sig') as f:
        # Tenta primeiro com csv.DictReader
        try:
            reader = csv.DictReader(f)
            if reader.fieldnames:
                print(f"✓ Headers encontrados: {reader.fieldnames}")
            
            for row_num, row in enumerate(reader, 1):
                if not row:
                    continue
                
                # Verifica se tem Ativo
                ativo = row.get('Ativo', '').strip()
                
                # Se Ativo='TRUE' (ou se o campo não existir, assume TRUE)
                if ativo != 'FALSE':
                    medico = row.get('Medico', '').strip()
                    modalidade = row.get('Modalidade', '').strip()
                    exame = row.get('Exames', '').strip()
                    codigo_aghu = row.get('Codigo_aghu', '').strip()
                    preparo = row.get('Preparo', '').strip()
                    observacao = row.get('Observacao', '').strip()
                    
                    # Só adiciona se temos pelo menos medico + codigo
                    if medico and codigo_aghu:
                        codigos_dados.append({
                            'Medico': medico,
                            'Modalidade': modalidade,
                            'Exames': exame,
                            'Codigo_aghu': codigo_aghu,
                            'Preparo': preparo,
                            'Observacao': observacao
                        })
                        codigos_count_active += 1
                        codigos_medicos.add(medico)
                        
        except Exception as e:
            print(f"Erro com DictReader: {e}, tentando parser manual...")
            raise
    
    print(f"✓ Total de registros com Ativo=TRUE: {codigos_count_active}")
    print(f"✓ Médicos únicos em codigos: {len(codigos_medicos)}")
    
except Exception as e:
    print(f"✗ Erro ao processar codigos.csv: {e}")
    exit(1)

# =====================================================================
# VALIDAÇÃO DE INTEGRIDADE
# =====================================================================
print("\n" + "=" * 70)
print("VALIDAÇÃO DE INTEGRIDADE")
print("=" * 70)

medicos_set = set(medicos_ativos)
medicos_nao_encontrados = codigos_medicos - medicos_set

if medicos_nao_encontrados:
    print(f"⚠ AVISO: {len(medicos_nao_encontrados)} médicos em codigos.csv não encontrados em medicos.csv:")
    for m in sorted(medicos_nao_encontrados)[:10]:  # Mostra primeiros 10
        print(f"  - {m}")
    if len(medicos_nao_encontrados) > 10:
        print(f"  ... e {len(medicos_nao_encontrados) - 10} outros")
else:
    print("✓ Todos os médicos em codigos.csv existem em medicos.csv")

# =====================================================================
# GERAR ARQUIVOS DE SAÍDA
# =====================================================================
print("\n" + "=" * 70)
print("GERANDO ARQUIVOS DE SAÍDA")
print("=" * 70)

# 1. Arquivo limpo de médicos
try:
    with open('medicos_limpo.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(['NOME', 'ATIVO'])
        for medico in sorted(medicos_ativos):
            writer.writerow([medico, 'TRUE'])
    print(f"✓ medicos_limpo.csv gerado ({len(medicos_ativos)} registros)")
except Exception as e:
    print(f"✗ Erro ao gerar medicos_limpo.csv: {e}")

# 2. Arquivo limpo de códigos
try:
    with open('codigos_aghu_limpo.csv', 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['Medico', 'Modalidade', 'Exames', 'Codigo_aghu', 'Preparo', 'Observacao', 'Ativo'])
        writer.writeheader()
        for codigo in codigos_dados:
            writer.writerow({
                'Medico': codigo['Medico'],
                'Modalidade': codigo['Modalidade'],
                'Exames': codigo['Exames'],
                'Codigo_aghu': codigo['Codigo_aghu'],
                'Preparo': codigo['Preparo'] if codigo['Preparo'] else '',
                'Observacao': codigo['Observacao'] if codigo['Observacao'] else '',
                'Ativo': 'TRUE'
            })
    print(f"✓ codigos_aghu_limpo.csv gerado ({len(codigos_dados)} registros)")
except Exception as e:
    print(f"✗ Erro ao gerar codigos_aghu_limpo.csv: {e}")

# =====================================================================
# GERAR SQL SEED
# =====================================================================
print("\n" + "=" * 70)
print("GERANDO SCRIPT SQL")
print("=" * 70)

medicos_dict = {m: i+1 for i, m in enumerate(sorted(medicos_ativos))}

sql_content = """-- =====================================================================
-- SEED: Médicos e Códigos AGHU - UDI (Unidade de Imagem Diagnóstica)
-- Gerado: """ + "Data real do projeto" + """
-- Dados: Recebidos dos arquivos CSV reais
-- =====================================================================

-- Limpeza (opcional - remova comentário para usar em ambiente fresh)
-- DELETE FROM public.codigos_aghu WHERE modalidade IN ('ULTRASSOM', 'TOMOGRAFIA', 'RAIO - X', 'MAMOGRAFO');
-- DELETE FROM public.medicos WHERE id > 0;

-- =====================================================================
-- INSERT MÉDICOS (""" + str(len(medicos_ativos)) + """ registros)
-- =====================================================================
INSERT INTO public.medicos (nome, ativo, created_at, updated_at) 
VALUES
"""

medicos_values = []
for i, medico in enumerate(sorted(medicos_ativos), 1):
    # Escapar aspas simples para SQL
    nome_escaped = medico.replace("'", "''")
    medicos_values.append(f"  ('{nome_escaped}', true, now(), now())")

sql_content += ",\n".join(medicos_values) + "\n"
sql_content += "ON CONFLICT (nome) DO NOTHING;\n\n"

sql_content += """-- =====================================================================
-- INSERT CÓDIGOS AGHU (""" + str(len(codigos_dados)) + """ registros)
-- =====================================================================
-- Usando WITH CTE para mapear médicos aos IDs
WITH medicos_map AS (
  SELECT id, nome FROM public.medicos WHERE nome IN (
"""

medicos_list = ",\n".join([f"    '{m.replace(chr(39), chr(39)+chr(39))}'" for m in sorted(medicos_ativos)])
sql_content += medicos_list + """
  )
)
INSERT INTO public.codigos_aghu 
  (medico_id, modalidade, exame, codigo_aghu, preparo, observacoes, ativo, created_at, updated_at)
VALUES
"""

codigos_values = []
for codigo in codigos_dados:
    medico_escaped = codigo['Medico'].replace("'", "''")
    modalidade_escaped = codigo['Modalidade'].replace("'", "''") if codigo['Modalidade'] else ""
    exame_escaped = codigo['Exames'].replace("'", "''") if codigo['Exames'] else ""
    codigo_aghu_escaped = codigo['Codigo_aghu'].replace("'", "''") if codigo['Codigo_aghu'] else ""
    preparo_escaped = codigo['Preparo'].replace("'", "''") if codigo['Preparo'] else None
    observacao_escaped = codigo['Observacao'].replace("'", "''") if codigo['Observacao'] else None
    
    preparo_sql = f"'{preparo_escaped}'" if preparo_escaped else "NULL"
    observacao_sql = f"'{observacao_escaped}'" if observacao_escaped else "NULL"
    
    codigos_values.append(
        f"  ((SELECT id FROM medicos_map WHERE nome = '{medico_escaped}'), "
        f"'{modalidade_escaped}', '{exame_escaped}', '{codigo_aghu_escaped}', "
        f"{preparo_sql}, {observacao_sql}, true, now(), now())"
    )

sql_content += ",\n".join(codigos_values) + "\n"
sql_content += "ON CONFLICT (medico_id, codigo_aghu) DO NOTHING;\n\n"

sql_content += """-- =====================================================================
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
"""

try:
    with open('supabase/seed_medicos_codigos_udi.sql', 'w', encoding='utf-8') as f:
        f.write(sql_content)
    print(f"✓ supabase/seed_medicos_codigos_udi.sql gerado")
    print(f"  - Médicos: {len(medicos_ativos)}")
    print(f"  - Códigos AGHU: {len(codigos_dados)}")
except Exception as e:
    print(f"✗ Erro ao gerar SQL: {e}")

print("\n" + "=" * 70)
print("✓ PROCESSAMENTO CONCLUÍDO COM SUCESSO")
print("=" * 70)
print("\nArquivos gerados:")
print("  1. medicos_limpo.csv - Lista de médicos ativos")
print("  2. codigos_aghu_limpo.csv - Códigos AGHU com medicos")
print("  3. supabase/seed_medicos_codigos_udi.sql - Script SQL para Supabase")
print("\nPróximo passo: Execute o SQL em seu banco de dados!")
