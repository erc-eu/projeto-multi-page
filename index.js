const express = require('express')
const basicAuth = require('express-basic-auth')
const nodemailer = require("nodemailer");
var cookieSession = require('cookie-session')
const app = express()
const port = 3000

app.set('view engine', 'ejs');
app.set('views', './views');

app.use(express.static('public'));
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const mongoRepository = require('./repository/mongo-repository')

app.use(cookieSession({
  name: 'ufc-web-session',
  secret: 'c293x8b6234z82n938246bc2938x4zb234',
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}))

app.get('/logout', (req, res) => {
  req.session = null
  res.redirect('/')
})

app.use((req, res, next) => {
  console.log('== Session Log Middleware');
  console.log(req.session);
  next();
});

app.use((req, res, next) => {
  console.log('== Root Middleware');
  if(req.path == '/'){
    if(req.session.user){
      console.log('Go home')
      res.redirect('/home')
    } else next();
  } else next();
});

app.get('/', (req, res)=>{
  res.redirect('/home');
})

app.get('/login', (req, res)=>{
    if(req.session.user)
    {
      res.redirect('/home');
    }else{
      mongoRepository.pegarTodosClientes().then((pegarCL)=>{
        res.render('login',{
        clients: pegarCL,
        session: req.session.user
      })
    })
    }
    
})


app.post('/login', (req, res) => {
  console.log('post - /login')
  console.log(req.body)
  mongoRepository.getUsersClients(req.body.email, req.body.senha).then(users => {
    if (users.length > 0){
      req.session.user = users[0]
      if(req.session.user.cargo != null)
      {
        res.redirect('/admin/loja')
        return
      }else{
        res.redirect('/loja')
        return
      }
    } else res.redirect('/')
  });
})


app.get('/home',(req,res) => {
  mongoRepository.pegarCarros(req.session.user).then((foundProds) => {
    res.render('home', {produtos: foundProds, session: req.session.user})
  });

})

app.get('/registrar', (req,res) =>{

  if(req.session.user)
  {
    res.redirect('/home');
  }else{
    mongoRepository.pegarTodosClientes().then((pegarCL)=>{
      res.render('registrar',{
      clients: pegarCL,
      session: req.session.user
    })
  })
  }
  
})


app.post('/registrar',(req, res)=>{
  mongoRepository.saveCliente(req.body).then((inserirCliente)=>{
    const transport = nodemailer.createTransport({
      host: "smtp.office365.com",
      port: 587,
      secure: false,
      auth: {
        user: "loja_alucar@hotmail.com",
        pass: "alucar123"
      }
    });
    transport.sendMail({
      from: "Alu Car <loja_alucar@hotmail.com> ",
      to: req.body.email,
      subject: "Email de confirmação ALU CAR",
      text: "EMAIL DE CONFIRMAÇÃO",
      html: "<h1>EMAIL DE CONFIRMAÇÃO ALU CAR </h1>"
    }).then(() =>console.log("EMAIL ENVIADO!")).catch((err)=>console.log("Erro ao Enviar", err));


    console.log('Cliente Registrado');
    console.log(inserirCliente);
    res.redirect('/');
  });
})

app.get('/loja', (req, res)=>{
  if(!req.session.user)
    {
      res.redirect('/home');
    }else{
      mongoRepository.pegarCarros().then((foundProds) => {
        res.render('loja', {produtos: foundProds, session: req.session.user})
      });
    }
})


app.get('/loja/alugar', (req, res)=>{
  if(!req.session.user)
    {
      res.redirect('/home');
    }else{
    mongoRepository.pegarUmCarro(req.query).then((foundCarro)=>{
         mongoRepository.getCarrosAluguel(req.query).then((foundAlugados)=>{
          res.render('loja/alugar',{carro: foundCarro, session: req.session.user, alugado: foundAlugados})
         });
     })
    }

})

app.get('/admin/loja',(req,res)=>{
  if(!req.session.user)
  {
    res.redirect('/home');
  }else
  {
    mongoRepository.pegarCarros().then((foundProds) => {
      res.render('admin/loja', {produtos: foundProds, session: req.session.user})
    });
  }
})

app.post('/admin/loja', (req, res) =>{
    mongoRepository.saveCarroAlugado(req.body).then((foundAluguel)=>{
      console.log("carro registrado no banco");
      console.log(foundAluguel);
      res.redirect('/loja/aluguel');
    })
})

app.get('/admin/aluguel', (req, res)=>{
  if(!req.session.user)
  {
    res.redirect('/home');
  }else
  {
    mongoRepository.getCarrosAluguelAdmin().then((carroAdmin)=>{
      res.render('admin/aluguel',{session:req.session.user ,carrosAlugadosAdmin: carroAdmin})
    })
  }
})

app.get('/admin/confirma', (req, res)=>{
  console.log(req.query);
    mongoRepository.aluguelConfirma(req.query).then((result)=>{
    if(result == 1)
    {
      res.redirect("/admin/aluguel");
    }
  });
})

app.get('/admin/rejeitar', (req, res)=>{
  console.log(req.query);
    mongoRepository.aluguelRejeitar(req.query).then((result)=>{
    if(result == 1)
    {
      res.redirect("/admin/aluguel");
    }
  });
})


app.get('/loja/aluguel',(req, res)=>{
  if(!req.session.user)
  {
    res.redirect('/home');
  }else
  {
    mongoRepository.getCarrosAluguelCliente(req.session.user).then((foundCarroAlugado)=>{
      res.render('loja/aluguel',{session: req.session.user, alugado: foundCarroAlugado});
    })
  }
})

app.get('/loja/conta', (req, res) =>{
  if(!req.session.user)
  {
    res.redirect('/home');
  }else{
    mongoRepository.getUserSession(req.session.user).then((foundUser)=>{
      res.render('loja/conta',{session:req.session.user, cliente: foundUser})
    })
  }
})

app.get('/loja/conta-editar', (req, res) =>{
  if(!req.session.user)
  {
    res.redirect('/home');
  }else{
    mongoRepository.getUserSession(req.session.user).then((foundUser)=>{
      res.render('loja/conta-editar',{session:req.session.user, cliente: foundUser})
    })
  }
})

app.post('/loja/conta-editar', (req, res) =>{
  mongoRepository.updateClienteConta(req.body).then(()=>{
    res.redirect('/loja/conta');
  })
})

app.get('/loja/conta-senha', (req, res) =>{
  if(!req.session.user)
  {
    res.redirect('/home');
  }else{
    mongoRepository.getUserSession(req.session.user).then((foundUser)=>{
      res.render('loja/conta-senha',{session:req.session.user, cliente: foundUser})
    })
  }
})

app.post('/loja/conta-senha', (req, res) =>{
  mongoRepository.updateClienteSenha(req.body).then(()=>{
    res.redirect('/loja/conta');
  })
})

app.get('/admin/loja/add-carro',(req, res) => {
  if(!req.session.user)
  {
    res.redirect('/home');
  }else{
    res.render('admin/loja/add-carro',{session: req.session.user});
  }
})

app.post('/admin/loja/add-carro',(req, res) => {
  let newCar = req.body 
  newCar.valor = parseFloat(newCar.valor);
  newCar.diaria = parseFloat(newCar.diaria);
  mongoRepository.addCarro(newCar);
  res.redirect('/');
})

app.get('/admin/loja/editar-carro',(req, res) => {
  if(!req.session.user)
  {
    res.redirect('/home');
  }else{
    mongoRepository.pegarUmCarro(req.query).then((foundCarro)=>{
      res.render('admin/loja/editar-carro',{session:req.session.user, carroEditar: foundCarro});
    })
  }
})

app.post('/admin/loja/editar-carro', (req, res)=>{
  let editCar = req.body;
  editCar.valorEdit = parseFloat(editCar.valorEdit);
  editCar.diariaEdit = parseFloat(editCar.diariaEdit);
  mongoRepository.updateCarro(editCar).then(()=>{
    res.redirect('/admin/loja');
  });
})

app.get('/admin/loja/excluir-carro', (req, res)=>{
    mongoRepository.excluirCarro(req.query);
    
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})