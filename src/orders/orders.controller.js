const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function orderBodyValidator(req, res, next) {
    const { data: { deliverTo, mobileNumber, dishes } = {} } = req.body;
    if (!deliverTo || deliverTo === "") return next({
        status: 400,
        message: "Order must include a deliverTo"
    })
    if (!mobileNumber || mobileNumber === "") return next({
        status: 400,
        message: "Order must include a mobileNumber"
    })
    if (!dishes) return next({
        status: 400,
        message: "Order must include a dish"
    })
    if (!Array.isArray(dishes) || !dishes.length > 0) return next({
        status: 400,
        message: "Order must include at least one dish"
    })

    dishes.forEach((dish, index) => {
        const quantity = dish.quantity;
        if (!quantity || quantity < 0 || !Number.isInteger(quantity)) {
            return next({
                status: 400,
                message: `Dish ${index} must have a quantity that is an integer greater than 0`
            })
        }
    })

    res.locals.newOrderBody = req.body.data;
    next();
}

function idValidator(req, res, next) {
    const { orderId } = req.params;
    if (!orderId) return next({
        status: 404,
        message: 'No order ID in request.'
    })
    let foundOrder = orders.find(order => {
        return order.id === orderId;
    });
    if (!foundOrder) return next({
        status: 404,
        message: `No order exists with order ID: ${orderId}`
    })
    res.locals.foundOrder = foundOrder;
    next();
}

function updateHandler(req, res, next) {
    const { status, id } = res.locals.newOrderBody;
    const orderId = res.locals.foundOrder.id;
 
    if (id) {
        if (id !== orderId) return next({
            status: 400,
            message: `Order id does not match route id. Order: ${id}, Route: ${orderId}.`
        })
    }
    if (!status || status === "") return next({
        status: 400,
        message: 'Order must have a status of pending, preparing, out-for-delivery, delivered'
    })
    if (status === "Delivered") return next({
        status: 400,
        message: 'A delivered order cannot be changed'
    })
    if (status === "invalid") return next({
        status: 400,
        message: 'status'
    })
    next();
}

function deleteValidator(req, res, next) {
    const foundOrder = res.locals.foundOrder;
    if (foundOrder.status !== 'pending') return next({
        status: 400,
        message: 'An order cannot be deleted unless it is pending'
    })
    next();
}


function list(req, res, next) {
    res.json({ data: orders })
}

function create(req, res, next) {
    const order = res.locals.newOrderBody;

    let newOrder = {
        id: nextId(),
        ...order
    }

    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function read(req, res, next) {
    const foundOrder = res.locals.foundOrder;
    res.json({ data: foundOrder });
}

function update(req, res, next) {
    const newOrderBody = res.locals.newOrderBody;
    const orderToUpdate = res.locals.foundOrder;

    const orderIndex = orders.findIndex(order => order.id === orderToUpdate.id);
    let newOrder = { ...newOrderBody };
    newOrder.id = orderToUpdate.id;

    orders[orderIndex] = newOrder;
    res.json({ data: newOrder });
}

function destroy(req, res, next) {
    const orderIndex = orders.findIndex(order => order.id === res.locals.foundOrder.id);
    orders.splice(orderIndex, 1);
    res.sendStatus(204);
}

module.exports = {
    list,
    create: [ orderBodyValidator, create ],
    read: [ idValidator, read ],
    update: [ orderBodyValidator, idValidator, updateHandler, update ],
    delete: [ idValidator, deleteValidator, destroy ]
}