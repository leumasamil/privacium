import { createClient } from '@supabase/supabase-js';
import { describe, expect, it } from 'vitest';
const sessionText=process.env['LOVABLE_BROWSER_SUPABASE_SESSION_JSON'];
const url=import.meta.env['VITE_SUPABASE_URL'];const key=import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'];
describe.skipIf(!sessionText||!url||!key)('Titulares: regras no banco e isolamento',()=>{
  it('salt inacessível, identificador salgado, prazo, operador, negativa e vínculo cruzado recusado',async()=>{
    if(!sessionText||!url||!key) throw new Error('Sessão ausente');
    const token=(JSON.parse(sessionText) as {access_token:string}).access_token;
    const db=createClient(url,key,{auth:{persistSession:false},global:{headers:{Authorization:`Bearer ${token}`}}});
    const emp=await db.from('empresas').select('id').eq('cnpj','98765432000198').single();if(!emp.data) throw new Error('Empresa de teste ausente');
    const rot=await db.from('registro_operacoes').select('id').eq('empresa_cnpj','98765432000198').eq('papel_agente','OPERADOR').is('excluido_em',null).eq('removida_do_dossie',false).limit(1).single();if(!rot.data) throw new Error('Operador de teste ausente');
    const salt=await db.from('salt_empresa').select('*');expect(salt.error).not.toBeNull();
    const texto='ID-FICTICIO-'+crypto.randomUUID();
    const p=await db.rpc('criar_solicitacao_titular',{_empresa_id:emp.data.id,_identificador:texto,_tipo:'OUTRO',_direito:'II',_canal:'Portal',_descricao:'Teste isolado automatizado',_recebimento:'2026-10-22',_produto_id:rot.data.id});expect(p.error).toBeNull();if(!p.data)throw new Error('Solicitação não criada');
    expect(p.data.identificador_hash).toMatch(/^[a-f0-9]{64}$/);expect(JSON.stringify(p.data)).not.toContain(texto);expect(p.data.prazo_resposta).toBe('2026-11-06');expect(p.data.tipo_prazo).toBe('LEGAL');expect(p.data.status).toBe('ENCAMINHADA_CONTROLADOR');
    const negativa=await db.rpc('atualizar_solicitacao_titular',{_id:p.data.id,_status:'NEGADA'});expect(negativa.error?.message).toContain('Negativa exige fundamento');
    const fora=await db.rpc('criar_solicitacao_titular',{_empresa_id:'00000000-0000-0000-0000-000000000000',_identificador:texto,_tipo:'OUTRO',_direito:'II',_canal:'Portal',_descricao:'Teste isolado',_recebimento:'2026-10-22',_produto_id:rot.data.id});expect(fora.error?.message).toContain('Empresa não autorizada');
    const m=await db.rpc('criar_solicitacao_titular',{_empresa_id:emp.data.id,_identificador:texto,_tipo:'OUTRO',_direito:'III',_canal:'Portal',_descricao:'Teste isolado de prazo do método',_recebimento:'2026-10-22'});expect(m.error).toBeNull();expect(m.data?.tipo_prazo).toBe('METODO');
    const buscar=await db.rpc('localizar_titular',{_empresa_id:emp.data.id,_identificador:texto,_tipo:'OUTRO'});expect(buscar.error).toBeNull();expect(buscar.data).toEqual([]);
  });
});