    import 'dotenv/config'
    import express from "express";
    import mongoose from "mongoose";
    import md5 from "md5";
    const app= express();
    app.use(express.static("public"));
    app.use(express.urlencoded({extended: true}));
    app.set('view engine', 'ejs');
   
    mongoose.connect('mongodb://127.0.0.1:27017/ToDoListAppDb',{useNewUrlParser: true});
    

    // User Schema for the user
    const userSchema= new mongoose.Schema({
        email: String,
        password: String
    });

   
    const User = new mongoose.model('User', userSchema );

    app.get('/', ( req, res ) => {
        res.render('home');
    });

    app.get('/login', ( req, res) => {
        res.render('login');
    });

    app.get('/register', ( req, res) => {
        res.render('register');
    });

    app.post('/register', ( req, res) => {
        const newUser = new User({
            email: req.body.username,
            password: md5( req.body.password)
        });
        newUser.save().then(() => {
        res.redirect('/todo');
        })
    });

    app.post('/login', ( req, res) =>{
        
            const username = req.body.username;
            const password = md5(req.body.password);
        
            User.findOne({email: username}).then( ( foundUser ) => {
                if( foundUser && foundUser.password === password ) {
                    res.redirect('/todo');
            }
                else{ 
                        console.log("Not Valid user");
                }
            })

    });

    // Schema for the todo list
    const todoSchema = new mongoose.Schema({
        name:String,
    });

    const Item = mongoose.model("Item", todoSchema);

    //Default Todo List Items
    const item1 = new Item({
        name: " Go to Market & pick up the parcel"
    });
    const item2 = new Item({
        name: " Complete English Assignment. Deadline for tomorrow!! "
    });
    const item3 = new Item({
        name: " Call lawyer to arrange the meeting."
    });

    const todolistArray = [item1, item2, item3];

    // other List Schema 
    const listSchema=({
        name: String,
        items:[todoSchema]
    })

    const List= mongoose.model('List',listSchema);

    app.get('/todo', function(req, res){

    Item.find({}).then( ( result )=> {
        if(result.length === 0){  // If no list in the database
            Item.insertMany( todolistArray ).then( () => { 
                console.log("Data inserted in the Todo List");
                res.redirect('/todo'); 
            })
        
        }
        else{
            res.render("list", { listTitle: "Today", newlistItems: result});
        }
    } )


    });

    // Custom List
    app.get("/todo/:customName", function(req, res){

    const customName = req.params.customName;
    //console.log(customName);
    //Finding the Custom List in the Database
    List.findOne({ name: customName }).then((foundlist => {
    if(!foundlist){
        const list = new List({
            name: customName,
            items:todolistArray
        });
    list.save().then(()=>{
        res.redirect('/todo');
    })
        }
    else {
        res.render("list", { listTitle: foundlist.name, newlistItems: foundlist.items});
    }
    }))


    })

    app.post('/todo', function(req, res){

    const itemName = req.body.newItem
    const ListName = req.body.list
    const item = new Item({
        name: itemName
    });
    if(ListName == "Today"){
    item.save();
    res.redirect('/todo');
    }
    else{
        List.findOne({name:ListName}).then((foundList)=>{
            foundList.items.push(item);
            foundList.save();
            res.redirect("/todo/" + ListName);
        })
    }

    })

    app.post('/delete', ( req, res ) => {

    const ListName= req.body.listName;
    const selectedCheckbox = req.body.checkbox;

    if(ListName == "Today"){
    Item.findByIdAndRemove(selectedCheckbox).exec();
    res.redirect('/todo');
    }
    else{
        List.findOneAndUpdate({name:ListName},
            { $pull : { items:{ _id:selectedCheckbox } }} ).then((foundList)=>{
                res.redirect("/todo/" + ListName);
        })
    }

    })


    app.listen(3000, () => { 
        console.log("Server starts at port 3000.");
    });