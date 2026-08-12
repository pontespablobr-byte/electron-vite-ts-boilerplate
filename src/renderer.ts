import './style.css'

interface Veiculo {
  id?: number
  placa: string
  modelo: string
  marca: string
  ano: number
}

interface Motorista {
  id?: number
  nome: string
  cnh: string
  telefone: string
}

interface Manutencao {
  id?: number
  id_veiculo: number
  tipo_servico: string
  data: string
  quilometragem: number
  custo: number
}

interface DespesaPorVeiculo {
  id_veiculo: number
  placa: string
  total_gasto: number
  quantidade_manutencoes: number
}

interface ResultadoValidacaoPlaca {
  valida: boolean
  formato: string
  mensagem: string
}

declare global {
  interface Window {
    api: {
      ping: () => Promise<string>
      veiculos: {
        listar: () => Promise<Veiculo[]>
        criar: (veiculo: Veiculo) => Promise<Veiculo>
        atualizar: (veiculo: Veiculo) => Promise<Veiculo>
        excluir: (id: number) => Promise<{ sucesso: boolean }>
      }
      motoristas: {
        listar: () => Promise<Motorista[]>
        buscar: (id: number) => Promise<Motorista | null>
        criar: (motorista: Omit<Motorista, 'id'>) => Promise<Motorista>
        atualizar: (id: number, motorista: Partial<Omit<Motorista, 'id'>>) => Promise<Motorista | null>
        excluir: (id: number) => Promise<{ sucesso: boolean }>
      }
      manutencoes: {
        listar: () => Promise<Manutencao[]>
        listarPorVeiculo: (idVeiculo: number) => Promise<Manutencao[]>
        criar: (manutencao: Omit<Manutencao, 'id'>) => Promise<Manutencao>
        atualizar: (id: number, manutencao: Partial<Omit<Manutencao, 'id'>>) => Promise<Manutencao | null>
        excluir: (id: number) => Promise<{ sucesso: boolean }>
        relatorioDespesas: () => Promise<DespesaPorVeiculo[]>
      }
      validarPlaca: (placa: string) => Promise<ResultadoValidacaoPlaca>
    }
  }
}

const appElement = document.getElementById('app') as HTMLDivElement

appElement.innerHTML = `
  <h1>Gestão de Manutenção de Veículos</h1>

  <section class="secao">
    <h2>Veículos</h2>
    <form id="form-veiculo">
      <input id="v-placa" type="text" placeholder="Placa (ex: ABC1D23)" required />
      <input id="v-modelo" type="text" placeholder="Modelo" required />
      <input id="v-marca" type="text" placeholder="Marca" required />
      <input id="v-ano" type="number" placeholder="Ano" required />
      <button type="submit">Cadastrar Veículo</button>
    </form>
    <ul id="lista-veiculos"></ul>
  </section>

  <hr />

  <section class="secao">
    <h2>Motoristas</h2>
    <form id="form-motorista">
      <input id="m-nome" type="text" placeholder="Nome" required />
      <input id="m-cnh" type="text" placeholder="CNH" required />
      <input id="m-telefone" type="text" placeholder="Telefone" required />
      <button type="submit">Cadastrar Motorista</button>
    </form>
    <ul id="lista-motoristas"></ul>
  </section>

  <hr />

  <section class="secao">
    <h2>Manutenções</h2>
    <form id="form-manutencao">
      <select id="mn-veiculo" required></select>
      <input id="mn-tipo" type="text" placeholder="Tipo de serviço" required />
      <input id="mn-data" type="date" required />
      <input id="mn-km" type="number" placeholder="Quilometragem" required />
      <input id="mn-custo" type="number" step="0.01" placeholder="Custo (R$)" required />
      <button type="submit">Lançar Manutenção</button>
    </form>
    <ul id="lista-manutencoes"></ul>
  </section>

  <hr />

  <section class="secao">
    <h2>Relatório de Despesas por Veículo</h2>
    <button id="btn-relatorio">Gerar Relatório</button>
    <ul id="lista-relatorio"></ul>
  </section>

  <hr />

  <section class="secao">
    <h2>Validar Placa</h2>
    <input id="input-placa" type="text" placeholder="Ex: ABC1D23" />
    <button id="btn-validar-placa">Validar</button>
    <p id="resultado-placa">Aguardando validação...</p>
  </section>
`

// ===================== VEÍCULOS =====================

const formVeiculo = document.getElementById('form-veiculo') as HTMLFormElement
const listaVeiculos = document.getElementById('lista-veiculos') as HTMLUListElement
const selectVeiculoManutencao = document.getElementById('mn-veiculo') as HTMLSelectElement

async function carregarVeiculos() {
  const veiculos = await window.api.veiculos.listar()

  listaVeiculos.innerHTML = veiculos
    .map(
      (v) => `
        <li>
          ${v.placa} - ${v.marca} ${v.modelo} (${v.ano})
          <button data-excluir-veiculo="${v.id}">Excluir</button>
        </li>
      `
    )
    .join('')

  selectVeiculoManutencao.innerHTML = veiculos
    .map((v) => `<option value="${v.id}">${v.placa} - ${v.marca} ${v.modelo}</option>`)
    .join('')

  listaVeiculos.querySelectorAll<HTMLButtonElement>('[data-excluir-veiculo]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.excluirVeiculo)
      await window.api.veiculos.excluir(id)
      await carregarVeiculos()
    })
  })
}

formVeiculo.addEventListener('submit', async (evento) => {
  evento.preventDefault()

  const placa = (document.getElementById('v-placa') as HTMLInputElement).value
  const modelo = (document.getElementById('v-modelo') as HTMLInputElement).value
  const marca = (document.getElementById('v-marca') as HTMLInputElement).value
  const ano = Number((document.getElementById('v-ano') as HTMLInputElement).value)

  try {
    await window.api.veiculos.criar({ placa, modelo, marca, ano })
    formVeiculo.reset()
    await carregarVeiculos()
  } catch (erro) {
    console.error('Erro ao criar veículo:', erro)
    alert('Erro ao cadastrar veículo. Verifique se a placa já existe.')
  }
})

// ===================== MOTORISTAS =====================

const formMotorista = document.getElementById('form-motorista') as HTMLFormElement
const listaMotoristas = document.getElementById('lista-motoristas') as HTMLUListElement

async function carregarMotoristas() {
  const motoristas = await window.api.motoristas.listar()

  listaMotoristas.innerHTML = motoristas
    .map(
      (m) => `
        <li>
          ${m.nome} - CNH: ${m.cnh} - Tel: ${m.telefone}
          <button data-excluir-motorista="${m.id}">Excluir</button>
        </li>
      `
    )
    .join('')

  listaMotoristas.querySelectorAll<HTMLButtonElement>('[data-excluir-motorista]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.excluirMotorista)
      await window.api.motoristas.excluir(id)
      await carregarMotoristas()
    })
  })
}

formMotorista.addEventListener('submit', async (evento) => {
  evento.preventDefault()

  const nome = (document.getElementById('m-nome') as HTMLInputElement).value
  const cnh = (document.getElementById('m-cnh') as HTMLInputElement).value
  const telefone = (document.getElementById('m-telefone') as HTMLInputElement).value

  try {
    await window.api.motoristas.criar({ nome, cnh, telefone })
    formMotorista.reset()
    await carregarMotoristas()
  } catch (erro) {
    console.error('Erro ao criar motorista:', erro)
    alert('Erro ao cadastrar motorista. Verifique se a CNH já existe.')
  }
})

// ===================== MANUTENÇÕES =====================

const formManutencao = document.getElementById('form-manutencao') as HTMLFormElement
const listaManutencoes = document.getElementById('lista-manutencoes') as HTMLUListElement

async function carregarManutencoes() {
  const manutencoes = await window.api.manutencoes.listar()

  listaManutencoes.innerHTML = manutencoes
    .map(
      (m) => `
        <li>
          Veículo #${m.id_veiculo} - ${m.tipo_servico} - ${m.data} -
          ${m.quilometragem} km - R$ ${Number(m.custo).toFixed(2)}
          <button data-excluir-manutencao="${m.id}">Excluir</button>
        </li>
      `
    )
    .join('')

  listaManutencoes.querySelectorAll<HTMLButtonElement>('[data-excluir-manutencao]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.dataset.excluirManutencao)
      await window.api.manutencoes.excluir(id)
      await carregarManutencoes()
    })
  })
}

formManutencao.addEventListener('submit', async (evento) => {
  evento.preventDefault()

  const id_veiculo = Number(selectVeiculoManutencao.value)
  const tipo_servico = (document.getElementById('mn-tipo') as HTMLInputElement).value
  const data = (document.getElementById('mn-data') as HTMLInputElement).value
  const quilometragem = Number((document.getElementById('mn-km') as HTMLInputElement).value)
  const custo = Number((document.getElementById('mn-custo') as HTMLInputElement).value)

  if (!id_veiculo) {
    alert('Cadastre um veículo antes de lançar uma manutenção.')
    return
  }

  try {
    await window.api.manutencoes.criar({ id_veiculo, tipo_servico, data, quilometragem, custo })
    formManutencao.reset()
    await carregarManutencoes()
  } catch (erro) {
    console.error('Erro ao criar manutenção:', erro)
    alert('Erro ao lançar manutenção.')
  }
})

// ===================== RELATÓRIO =====================

const btnRelatorio = document.getElementById('btn-relatorio') as HTMLButtonElement
const listaRelatorio = document.getElementById('lista-relatorio') as HTMLUListElement

btnRelatorio.addEventListener('click', async () => {
  const relatorio = await window.api.manutencoes.relatorioDespesas()

  listaRelatorio.innerHTML = relatorio
    .map(
      (r) => `
        <li>
          ${r.placa} - ${r.quantidade_manutencoes} manutenção(ões) -
          Total gasto: R$ ${Number(r.total_gasto).toFixed(2)}
        </li>
      `
    )
    .join('')
})

// ===================== VALIDAR PLACA =====================

const inputPlaca = document.getElementById('input-placa') as HTMLInputElement
const btnValidarPlaca = document.getElementById('btn-validar-placa') as HTMLButtonElement
const resultadoPlaca = document.getElementById('resultado-placa') as HTMLParagraphElement

btnValidarPlaca.addEventListener('click', async () => {
  const placa = inputPlaca.value
  if (!placa) {
    resultadoPlaca.textContent = 'Digite uma placa antes de validar.'
    return
  }

  try {
    const resultado = await window.api.validarPlaca(placa)
    resultadoPlaca.textContent = resultado.mensagem
    resultadoPlaca.style.color = resultado.valida ? '#4ade80' : '#f87171'
  } catch (erro) {
    resultadoPlaca.textContent = 'Erro ao validar placa.'
    console.error(erro)
  }
})

// ===================== INICIALIZAÇÃO =====================

async function inicializar() {
  await carregarVeiculos()
  await carregarMotoristas()
  await carregarManutencoes()
}

inicializar()

export {}