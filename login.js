const mysql = require('mysql');
const express = require('express');
const session = require('express-session');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json())


//--------- conexão com o banco de dados MYSQL

var mysqlConnection = mysql.createConnection({
host: 'localhost',
user: 'root',
password: 'pass1Word!',
database: 'projeto',
multipleStatements: true
});

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', function(request, response) {	
	if (request.session.loggedin) {
		let name = request.session.username;
		response.render('index',{username:name});
	} else {
		response.render("login.ejs");
	}
	
});


//--------- renderiza a página de registro de novos usuários  -------------

app.get('/registro', function(request, response) {
	response.render("registro.ejs");
});


//  Autentica o usuário com os dados fornecidos na página de login(inicial)

app.post('/auth', function(request, response) {
	let username = request.body.username;
	let password = request.body.password;
	if (username && password) {
		mysqlConnection.query('SELECT * FROM usuario WHERE nomeUsuario = ? AND senhaUsuario = ?', 
			[username, password], (error, results, fields) => {
			console.log(results);
			if (error) throw error;
			// verifica erros
			if (results.length > 0) {
				// verifica o usuario
				request.session.loggedin = true;
				request.session.username = username;
				// redireciona a pagina que leva ao registro de clientes
				response.redirect('/inicial');
			} else {
				response.send('nome ou senha incirretos');
			}			
			response.end();
		});
	} else {
		response.send('entre usuário e senha');
		response.end();
	}
});

//--------  pagina inicial, se logado mostra link para registro de novos produtores/propriedades
//--------  se não leva para a pagina inicial
app.get('/inicial', function(request, response,next) {
	// If the user is loggedin
	console.log(request.session);
	let name = request.session.username;
	if (request.session.loggedin) {
		// Output username
		response.render('index',{username:name});
	} else {
		// Not logged in
		response.render('login');
	}
	response.end();
});


//--------   altera o valor de sessão e realiza o logout redirecionando para a pagina inicial

app.get('/sair', function(request, response,next) {
	// If the user is loggedin
	console.log(request.session);
	request.session.loggedin = false;
	let name = request.session.username;
	if (request.session.loggedin) {
		// Output username
		response.render('index',{username:name});
	} else {
		// Quando termina a sessão volta à pagina de Login
		response.render('login');
	}
	response.end();
});



// insere nome e senha na tabela usuário

app.post('/inserir', (req, res) => {
	let sql = "'INSERT INTO usuario (nomeUsuario,senhaUsuario) VALUES (?,?) '";
	let username = req.body.username;
	let password = req.body.password;

	mysqlConnection.query('INSERT INTO usuario (nomeUsuario,senhaUsuario) VALUES (?,?)', 
			[username, password], (err, rows, fields) => {
		if (!err)
			res.send(rows);
		else
		console.log(err);
	})
});


// ----   verifica se está logado para redirecionar à pagina de registro de produtores/propriedades
// ----   caso não manda para pagina inicial
// ----   evita o acesso pela barra de endereços

app.get('/regiscliente', function(request, response) {
	if(request.session.loggedin){
		response.render("reg_cliente.ejs");
	}else{
		response.render("login.ejs");
	}
});


// ---- faz o registro de novos clietntes no banco de dados
app.post('/regcliente', function(request, response) {
	let nomeProdutor = request.body.nomeProdutor;
	let cpfProdutor = request.body.cpfProdutor;
	let nomePropriedade = request.body.nomePropriedade;
	let cadastroRural = request.body.cadastroRural;


	let sql1 = 'INSERT INTO Produtor (nomeProdutor,cpfProdutor) VALUES (?,?) ; INSERT INTO Propriedade (nomePropriedade,cadastroRural) VALUES (?,?)';
	// let sql2 = 'INSERT INTO Propriedade (nomePropriedade,cadastroRural) VALUES (?,?)';

	mysqlConnection.query(sql1,[nomeProdutor, cpfProdutor,nomePropriedade, cadastroRural], (err, rows, fields) => {
		if (!err)
			response.send(rows);
		else
			console.log(err);
	});
});


// ----- renderiza a página de busca de produtor

app.get('/busca_produtor', function(request, response) {
	// Render login template
	// response.sendFile(path.join(__dirname + '/registro.html'));
	response.render("busca.ejs");
});


//  ----  realiza a busca por id do produtor no banco de dados

app.post('/busca_produtor', function(req, res, next) {
	console.log(req.body);
  	let valor = req.body.valor;
  	sql_busca = 'SELECT * FROM Produtor WHERE idProdutor = ?';
  	mysqlConnection.query(sql_busca,[valor],(err, rows, fields) => {
		if (!err){
			//res.render('busca',{rows:rows});
			console.log(rows);
		}else{
			console.log(err);
		}
	});
	res.render("busca");
});


//  ---   renderiza a página de busca por propriedade

app.get('/busca_propriedade', function(request, response) {
	response.render("buscapropriedade.ejs");
});

// --- realiza a busca por id da propriedade no banco de dados 

app.post('/busca_propriedade', function(req, res, next) {
	console.log(req.body);
  	let valor_propri = req.body.valor_propri;
  	sql_busca = 'SELECT * FROM Propriedade WHERE idPropriedade = ?';
  	mysqlConnection.query(sql_busca,[valor_propri],(err, rows, fields) => {
		if (!err){
			//res.render('busca',{rows:rows});
			console.log(rows);
		}else{
			console.log(err);
		}
	});
	res.render("buscapropriedade");
});


let port = process.env.PORT || 8080;
app.listen(port);
console.log("iniciou", port);