import { contextBridge, ipcRenderer } from 'electron'

export interface Veiculo {
  id?: number
  placa: string
  modelo: string
  marca: string
  ano: number
}

export interface Motorista {
  id?: number
  nome: string
  cnh: string
  telefone: string
}

export interface Manutencao {
  id?: number
  id_veiculo: number
  tipo_servico: string
  data: string
  quilometragem: number
  custo: number
}

export interface DespesaPorVeiculo {
  id_veiculo: number
  placa: string
  total_gasto: number
  quantidade_manutencoes: number
}

export interface ResultadoValidacaoPlaca {
  valida: boolean
  formato: string
  mensagem: string
}

contextBridge.exposeInMainWorld('api', {
  ping: () => ipcRenderer.invoke('canal-ping'),

  veiculos: {
    listar: (): Promise<Veiculo[]> => ipcRenderer.invoke('veiculos:listar'),
    criar: (veiculo: Veiculo): Promise<Veiculo> => ipcRenderer.invoke('veiculos:criar', veiculo),
    atualizar: (veiculo: Veiculo): Promise<Veiculo> => ipcRenderer.invoke('veiculos:atualizar', veiculo),
    excluir: (id: number): Promise<{ sucesso: boolean }> => ipcRenderer.invoke('veiculos:excluir', id),
  },

  motoristas: {
    listar: (): Promise<Motorista[]> => ipcRenderer.invoke('motoristas:listar'),
    buscar: (id: number): Promise<Motorista | null> => ipcRenderer.invoke('motoristas:buscar', id),
    criar: (motorista: Omit<Motorista, 'id'>): Promise<Motorista> =>
      ipcRenderer.invoke('motoristas:criar', motorista),
    atualizar: (id: number, motorista: Partial<Omit<Motorista, 'id'>>): Promise<Motorista | null> =>
      ipcRenderer.invoke('motoristas:atualizar', id, motorista),
    excluir: (id: number): Promise<{ sucesso: boolean }> => ipcRenderer.invoke('motoristas:excluir', id),
  },

  manutencoes: {
    listar: (): Promise<Manutencao[]> => ipcRenderer.invoke('manutencoes:listar'),
    listarPorVeiculo: (idVeiculo: number): Promise<Manutencao[]> =>
      ipcRenderer.invoke('manutencoes:listarPorVeiculo', idVeiculo),
    criar: (manutencao: Omit<Manutencao, 'id'>): Promise<Manutencao> =>
      ipcRenderer.invoke('manutencoes:criar', manutencao),
    atualizar: (id: number, manutencao: Partial<Omit<Manutencao, 'id'>>): Promise<Manutencao | null> =>
      ipcRenderer.invoke('manutencoes:atualizar', id, manutencao),
    excluir: (id: number): Promise<{ sucesso: boolean }> => ipcRenderer.invoke('manutencoes:excluir', id),
    relatorioDespesas: (): Promise<DespesaPorVeiculo[]> => ipcRenderer.invoke('manutencoes:relatorioDespesas'),
  },

  validarPlaca: (placa: string): Promise<ResultadoValidacaoPlaca> =>
    ipcRenderer.invoke('validar-placa', placa),
})