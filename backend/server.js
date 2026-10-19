const express = require('express')
const app = express();

// Permet de lire le json envoyé oar le front 
app.use(express.json());

//Test rout
app.get('/', (req, res) => {
    res.json({message: 'Page & Frame API is running'});

});

app.listen(5000, () => {
    console.log('server is running on port 5000');

});