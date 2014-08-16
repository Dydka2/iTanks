exports.testSomething = function(test){
    test.expect(1);
    test.ok(true, "this assertion should pass");
    test.done();
};

exports.testSomethingElse = function(test){
    setTimeout(function() {
        test.ok(false, "this assertion should fail");
        test.done();
    }, 3000);
};
