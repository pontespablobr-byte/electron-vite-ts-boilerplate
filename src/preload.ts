import { contextBridge, ipcRenderer } from 'electron'

export interface Veiculo {
  id?: number
  placa: string
  modelo: string
  marca: string
  ano: number
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

  validarPlaca: (placa: string): Promise<ResultadoValidacaoPlaca> =>
    ipcRenderer.invoke('validar-placa', placa),
})