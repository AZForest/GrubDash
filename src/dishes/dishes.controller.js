const path = require("path");

// Use the existing dishes data
const dishes = require(path.resolve("src/data/dishes-data"));

// Use this function to assign ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /dishes handlers needed to make the tests pass

function dishExists(req, res, next) {
    const { data: { name, description, price, image_url } = {} } = req.body;
    if (!name || name === "") return next({
        status: 400,
        message: 'Dish must include a name'
    })
    if (!description || description === "") return next({
        status: 400,
        message: 'Dish must include a description'
    })
    if (!price) return next({
        status: 400,
        message: 'Dish must include a price'
    })
    if (price < 0 || typeof price !== 'number') return next({
        status: 400,
        message: 'Dish must have a price that is an integer greater than 0'
    })
    if (!image_url || image_url === "") return next({
        status: 400,
        message: 'Dish must include a image_url'
    })
    res.locals.data = req.body.data;
    next();
}

function idExists(req, res, next) {
    const { dishId } = req.params;
    if (!dishId) return next({
            status: 404,
            message: `Dish does not exist.`
        })
        
    let foundDish = dishes.find(dish => dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        return next();
    }
    next({
        status: 404,
        message: `No dish exists with dish ID: ${dishId}`
    })
}

function updateHandler(req, res, next) {
    const dishId = res.locals.dish.id;
    const { id } = res.locals.data;

    if (id) {
        if (id !== dishId) {
            return next({
                status: 400,
                message: `id: ${id} doesn't match route id: ${dishId}`
            })
        }
    }
    next();
}

function list(req, res, next) {
    res.json({ data: dishes })
}

function create(req, res, next) {
    const dish = res.locals.data;
    const newDish = {
        id: nextId(),
        ...dish
    }
    dishes.push(dish);
    res.status(201).json({ data: newDish })
}

function read(req, res, next) {
    res.json({ data: res.locals.dish })
}

function update(req, res, next) {
    const data = res.locals.data;
    const dish = res.locals.dish;

    let foundIndex = dishes.findIndex(dbDish => dbDish.id === dish.id);
    let newDish = { ...data };
    newDish.id = dish.id;
    dishes[foundIndex] = newDish; 
    res.json({ data: newDish });
}



module.exports = {
    list,
    create: [ dishExists, create ],
    read: [ idExists, read ],
    update: [ idExists, dishExists, updateHandler, update ]
}