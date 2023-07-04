//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-braden:test123@cluster0.bxpeqbj.mongodb.net/todolistDB?retryWrites=true&w=majority")

const itemsSchema = {
  name: String
}

//new mongoose model, model name for model is usually capitalized singular
const Item = mongoose.model("Item", itemsSchema)


const work = new Item({
  name: "Get work done!"
});

const gym = new Item({
  name: "Go to Gym!"
});

const food = new Item({
  name: "Make a good dinner!"
});
// new array with all default items above
const defaultItems = [work, gym, food]

const listSchema = {
  name: String,
  items: [itemsSchema]
}

const List = mongoose.model("List", listSchema);

app.get("/", async function (req, res) {

  Item.find({})
  .then(foundItems => {

    if (foundItems.length === 0) {
      Item.insertMany(defaultItems).then(function () {
        console.log("Successfully saved default items to DB");
      })
      .catch(function (err) {
        console.log(err);
      });
      res.redirect("/");
    } else {
      res.render("list", {listTitle: "Today", newListItems: foundItems});
    }

  })
  .catch(err => {
    console.error(err);
  });

});

app.get("/:customListName", function(req, res){

  const customListName = _.capitalize(req.params.customListName);

    List.findOne({ name: customListName })
    .then(function(foundList){
      //if list is found
        if (foundList != null) {
            res.render("list", {listTitle: foundList.name, newListItems: foundList.items})
        } else {
          //make a new list
          const list = new List  ({
            name: customListName,
            items: defaultItems
          });
          list.save();
          res.redirect("/" + customListName)
        }
    })
    
  
})


app.post("/", function (req, res) {
  const listName = req.body.list;
  const itemName = req.body.newItem;

  const item = new Item({
    name: itemName
  });

  if(listName === "Today") {
    item.save()
    res.redirect("/")
  } else {
    List.findOne({name:listName}).then(function(foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    })
  }
});


app.post("/delete", function (req, res){
const checkedItemId = req.body.checkbox;
const listName = req.body.listName;

if(listName === "Today"){
  Item.findByIdAndRemove(checkedItemId).then(function(){
    res.redirect("/");
   }).catch(function(){
    console.log(err)
   })
} else {
  List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}).then(function(err, foundList){
    if(foundList != null){
      res.redirect("/" + listName);
    }
  });
}
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.listen(3000, function () {
  console.log("Server started on port 3000");
});