"use strict";
var Context = require('./context');

function RecipeInTheOven(tpl, recipe){
    this.recipe = recipe;
    this.ctx = new Context(tpl);
}

function Recipe(){
    this.steps = {};
    this.nameToStep = {};
}

// @todo (lucas) Keep a mapping so we can fire callbacks when particular
// steps are called to do other things, ie transform.
Recipe.prototype.register = function(name, func){
    if(!this.steps[name]){
        this.steps[name] = [];
    }

    this.steps[name].push(func);
    return this;
};

// Declare a task.
Recipe.prototype.task = function(){};

// Register a transform callback.
// Recipe.prototype.transform = function(name, cb){
//     return this;
// };

Recipe.prototype.configure = function(tpl){
    this.ctx.extend(tpl);
    return this;
};

module.exports = Recipe;
