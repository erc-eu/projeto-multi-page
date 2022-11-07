const { MongoClient, ObjectId } = require('mongodb');

// Connection URL
const url = 'mongodb://root:rootpwd@localhost:27017';
const client = new MongoClient(url);

// Database Name
const dbName = 'projeto';

var admin_collection;
var cliente_collection;
var carros_collection;
var alugar_collection;

async function main() {
  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to Mongo server');
  const db = client.db(dbName);
  admin_collection = db.collection('admin');
  cliente_collection = db.collection('cliente');
  carros_collection = db.collection('carros');
  alugar_collection = db.collection('alugados');
  // the following code examples can be pasted here...
   
  return 'done.';
}

main()
  .then(console.log)
  .catch(console.error);  
//.finally(() => client.close());



async function pegarCarros()
{
  
    var dataAtual = new Date();
    const carrosAlugadoConfirma = await alugar_collection.find({statusAlugado:"Confirmado"}).toArray();
    const carrosAlugadoRejeita = await alugar_collection.find({statusAlugado:"Rejeitado"}).toArray();
    
    if(carrosAlugadoConfirma != '')
    { 
       for (let i = 0; i < carrosAlugadoConfirma.length; i++) {
        var dateInit = new Date(carrosAlugadoConfirma[i].datainicio);
        var dateFim = new Date(carrosAlugadoConfirma[i].datafim);
        console.log("Atual: ",dataAtual);
        console.log("Inicio: ",dateInit);
        console.log("Fim: ",dateFim);
        if(dataAtual >= dateInit && dataAtual <= dateFim)
        {
          await carros_collection.updateOne({"_id": ObjectId(carrosAlugadoConfirma[i]._idCarroAlugado)}, {$set :{status:"Indisponivel Hoje"}});
          await carros_collection.updateOne({"_id": ObjectId(carrosAlugadoConfirma[i]._idCarroAlugado)}, {$set :{datainicial:dateInit.toLocaleString()}});
          await carros_collection.updateOne({"_id": ObjectId(carrosAlugadoConfirma[i]._idCarroAlugado)}, {$set :{datafinal:dateFim.toLocaleString()}});
        }else if(dataAtual > dateFim){
          await carros_collection.updateOne({"_id": ObjectId(carrosAlugadoConfirma[i]._idCarroAlugado)}, {$set:{status:"Disponivel Hoje"} });
          await alugar_collection.updateOne({statusAlugado:"Confirmado"}, {$set:{statusAlugado:"Rejeitado"}});
          await carros_collection.updateOne({"_id": ObjectId(carrosAlugadoConfirma[i]._idCarroAlugado)}, {$set :{datafinal:""}});
        }
      }
    }

    if(carrosAlugadoRejeita != '')
    {
      for (let i = 0; i < carrosAlugadoRejeita.length; i++) {
        await carros_collection.updateOne({"_id": ObjectId(carrosAlugadoRejeita[i]._idCarroAlugado)}, {$set:{status:"Disponivel Hoje"} });
        await alugar_collection.remove({statusAlugado:"Rejeitado"}, {justOne:true});
      }
    }
    if(await alugar_collection.find().toArray() == '')
    {
      await carros_collection.updateOne({status: "Indisponivel Hoje"}, {$set:{status:"Disponivel Hoje"}});
      await carros_collection.updateOne({status: "Disponivel Hoje"}, {$set:{datafinal:""}});
    }

    const carros = await carros_collection.find().toArray();
    return carros;
  
}

async function pegarUmCarro(carro)
{
  const salvarCarro = [];
  const guardarCarro = await carros_collection.find({"_id":ObjectId(carro._id)}).toArray();
  return guardarCarro;
}

async function getCarrosAluguel(car)
{
 
  const guardarCarroAlugado = await alugar_collection.find({_idCarroAlugado: car._id}).toArray();
  if(guardarCarroAlugado != '')
  {
    return guardarCarroAlugado;
  }
  else{
    const guardarCarro= await alugar_collection.find().toArray();
    return guardarCarro;
  }
}

async function getCarrosAluguelCliente(userSession)
{
    if(userSession == '')
    {
      const guardarCarroAlugado = await alugar_collection.find().toArray();
      return guardarCarroAlugado;
    }
    const guardarCarroAl = await alugar_collection.find({userAlugou: userSession.email}).toArray();
    return guardarCarroAl;
}


async function getCarrosAluguelAdmin()
{
  const guardarCarroAlugado  = await alugar_collection.find().toArray();
  return guardarCarroAlugado;
}

async function aluguelConfirma(carroAlugado)
{
  console.log(carroAlugado._id);
  await alugar_collection.updateOne({"_id": ObjectId(carroAlugado._id)}, {$set: {statusAlugado:"Confirmado"}});
  return 1;
}

async function aluguelRejeitar(carroAlugado)
{
  console.log(carroAlugado._id);
  await alugar_collection.updateOne({"_id": ObjectId(carroAlugado._id)}, {$set: {statusAlugado:"Rejeitado"}});
  return 1;
}


async function getUsersClients(email, senha)
{
  const findCliente = await cliente_collection.find({email: email, senha1: senha}).toArray();
  const findAdmin = await admin_collection.find({email: email, senha: senha})
  if(findCliente[0] == undefined)
  {
    return findAdmin;
  }else{
    return findCliente;
  }
}

//pegar os dados do cliente que está logado
async function getUserSession(session)
{
  console.log(session.email);
  const findCliente = await cliente_collection.find({email:session.email, senha:session.senha}).toArray();
  return findCliente;
}

async function updateClienteConta(cliente){

  const salvarCliente = [];
  const guardarCliente = await cliente_collection.find().toArray();
  for (let i = 0; i < guardarCliente.length; i++) {
    if(guardarCliente[i]._id == cliente._id)
    {
      salvarCliente[0] = guardarCliente[i];
    }
  }

  await cliente_collection.updateOne({_id: salvarCliente[0]._id}, { $set: {nome: cliente.nome
  ,data: cliente.data, sexo: cliente.sexo, telefone: cliente.telefone, email:cliente.email}});
};

async function updateClienteSenha(cliente){
  const salvarCliente = [];
  const guardarCliente = await cliente_collection.find().toArray();
  for (let i = 0; i < guardarCliente.length; i++) {
    if(guardarCliente[i]._id == cliente._id)
    {
      salvarCliente[0] = guardarCliente[i];
    }
  }
  await cliente_collection.updateOne({_id: salvarCliente[0]._id}, {$set: {senha1: cliente.senha1, senha2: cliente.senha2}});
}

async function updateCarro(carro)
{
  await carros_collection.updateOne({"_id": ObjectId(carro._idEdit)}, {$set: {nome: carro.nomeEdit,
  marca: carro.marcaEdit, cor: carro.corEdit, valor: carro.valorEdit, diaria: carro.diariaEdit}});
}

async function excluirCarro(carro)
{
  console.log(carro._id);
  const carroAlugado = await alugar_collection.find({_idCarroAlugado: carro._id}).toArray();
  
  console.log("AQUI", carroAlugado);
    

  if(carroAlugado == '')
  {
    console.log("existe");
    await carros_collection.remove({"_id": ObjectId(carro._id)}, {justOne:true});
  }
}


async function saveCliente(cliente){
  const result = await cliente_collection.insertOne(cliente)
  console.log('Repository - saveCliente - Inserted prod')
  console.log(result)
  return result;
}

async function addCarro(carro)
{
  const result = await carros_collection.insertOne(carro);
  return result;
}

async function saveCarroAlugado(carroAlugado)
{
  const result = await alugar_collection.insertOne(carroAlugado)
  console.log(result)
  return result;
}

async function pegarTodosClientes()
{
  const cl = await cliente_collection.find().toArray();
  return cl;
}

exports.saveCarroAlugado = saveCarroAlugado;
exports.saveCliente = saveCliente;
exports.addCarro = addCarro;

exports.updateClienteConta = updateClienteConta;
exports.updateClienteSenha = updateClienteSenha;
exports.updateCarro = updateCarro;
exports.excluirCarro = excluirCarro;

exports.pegarCarros = pegarCarros;
exports.pegarUmCarro = pegarUmCarro;

exports.getCarrosAluguel = getCarrosAluguel;
exports.getCarrosAluguelCliente=  getCarrosAluguelCliente;
exports.getCarrosAluguelAdmin = getCarrosAluguelAdmin;
exports.aluguelConfirma = aluguelConfirma;
exports.aluguelRejeitar = aluguelRejeitar;

exports.pegarTodosClientes = pegarTodosClientes;
exports.getUsersClients =  getUsersClients;
exports.getUserSession =  getUserSession;


