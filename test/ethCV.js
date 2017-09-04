var cv = artifacts.require("./ethCV.sol");

contract('ethCV', function(accounts) {
  it("should respond on the 4 standard functions", function() {
    return cv.deployed().then(function(instance) {
      instance.getAddress.call(accounts[0]).then(function(url){
        assert.equal(url, "https://devin-m-d.github.io/ethereumcv/");
      });

      instance.getDescription.call(accounts[0]).then(function(desc){
        assert.equal(desc, "A smart contract resume showing ethereum certification");
      });

      instance.getTitle.call(accounts[0]).then(function(title){
        assert.equal(title, "Ethereum CV");
      });

      instance.getAuthor.call(accounts[0]).then(function(result){
        assert.equal(result[0], "Devin");
        assert.equal(result[1], "downer.devin@gmail.com");
      });
    });
  });

  it("should ingest a new personal project", function(){
    return cv.deployed().then(function(instance){
      instance.acceptProject("test project", "test description", {from: accounts[0]}).then(function(tx){
        assert.equal(tx.logs[0].args.name, "test project");
        assert.equal(tx.logs[0].args.description, "test description");
      });
    });
  });

  it("should ingest a new professional experience", function(){
    return cv.deployed().then(function(instance){
      var startDate = Math.round(new Date("2017-01-01").getTime() / 1000);

      return instance.acceptExperience("test company", "software engineer", "solidity, SQL", startDate, 0, {from: accounts[0]});
    }).then(function(tx){
      assert.equal(tx.logs[0].args.title, "software engineer");
      assert.equal(tx.logs[0].args.end_date.toNumber(), 0);
    });
  });

  it("should ingest a new project idea from a non-owner", function(){
    return cv.deployed().then(function(instance){
      return instance.acceptNewIdea("awesome blockchain project", "solves all the world's problems", {from: accounts[1]});
    }).then(function(tx){
      assert.equal(tx.logs[0].args.name, "awesome blockchain project");
      assert.equal(tx.logs[0].args.description, "solves all the world's problems");
    });
  });

  it("should accept funding for a project idea", function(){
    var contractInstance;
    return cv.deployed().then(function(instance){
      contractInstance = instance;      
    }).then(function(){
      return contractInstance.fundIdea(0, {from: accounts[2], value: web3.toWei(1.5, "ether")});
    }).then(function(tx){
      assert.equal(tx.logs[0].args.id, 0);
      assert.equal(web3.fromWei(tx.logs[0].args.amount.toNumber(), "ether"), 1.5);
      return web3.eth.getBalance(contractInstance.address);
    }).then(function(contractBal){
      assert.equal(web3.fromWei(contractBal.toNumber(), "ether"), 1.5);
    });
  });

  it("should allow owner to complete a project, setting url withdrawing funds", function(){
    var cInstance;
    return cv.deployed().then(function(instance){
      cInstance = instance;
      return cInstance.completeIdea(0, "www.projecturl.io", {from: accounts[0], gas: 200000});
    }).then(function(tx){
      assert.equal(tx.logs[0].args.id, 0);
      assert.equal(tx.logs[0].args.url, "www.projecturl.io");
      return web3.eth.getBalance(cInstance.address).toNumber();
    }).then(function(newBal){
      assert.equal(web3.fromWei(newBal, "ether"), 0);
    });
  });

  it("should not allow non-owner to complete a project", function(){
    return cv.deployed().then(function(instance){
      return instance.completeIdea(0, "www.projecturl.io", {from: accounts[2]});
    }).then(function(tx){
      //console.log(tx);
      
    });
  });
});
