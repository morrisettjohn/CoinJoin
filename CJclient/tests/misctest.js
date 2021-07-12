var person = {
    firstname: "John",
    lastname: "Morrisett",
    midname: undefined,
    sayHello: function () { }
};
person.sayHello = function () {
    console.log("hello" + person.firstname);
};
console.log(person.midname);
person.midname = "Caudle";
console.log(person.midname);
