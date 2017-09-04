// Import the page's CSS. Webpack will know what to do with it.
import "../stylesheets/app.css";

import "bootstrap/dist/css/bootstrap.css";

// Import libraries we need.
import { default as Web3} from 'web3';
import { default as contract } from 'truffle-contract'

// Import our contract artifacts and turn them into usable abstractions.
import cv_artifacts from '../../build/contracts/ethCV.json'
var cv = contract(cv_artifacts);

var accounts;
var account;

window.App = {
  start: function() {
    var self = this;
    cv.setProvider(web3.currentProvider);

    web3.eth.getAccounts(function(err, accs) {
      console.log(accs);
      if (err != null) {
        alert("There was an error fetching your accounts.");
        return;
      }

      if (accs.length == 0) {
        alert("Couldn't get any accounts! Make sure your Ethereum client is configured correctly.");
        return;
      }

      accounts = accs;
      account = accounts[0];

      //document.getElementById("addresses").innerHTML = accounts.join("<br />");
      document.getElementById("userAccount").innerHTML = account;
      
      App.listenToEvents();
      App.strapUI();
    });

    cv.deployed().then(function(instance){
      web3.eth.getBalance(instance.address, function(error, weiBal){
        if (!error){
          console.log(weiBal.toNumber());
          document.getElementById("userBalance").innerHTML = web3.fromWei(weiBal.toNumber(), "ether");
        }
      });
    });
    

    // web3.eth.getCoinbase(function (err, data) {
    //   if (err === null) {
    //       //console.log(data);
    //       account = data;

    //       web3.eth.getBalance(account, function (err, data) {
    //           if (err === null) {
    //             var accountBalance = data;
    //             document.getElementById("userAccount").innerHTML = account;
    //             document.getElementById("userBalance").innerHTML = accountBalance;
    //           }
    //       });
    //   }
    // 
    //   App.listenToEvents();
    //   App.basicInfoUpdate();
    // });


  },
  strapUI: function(){
    cv.deployed().then(function(instance){
      //return instance.isOwner(account);
      return true;
    }).then(function(result){
      if (result){ 
        document.getElementById("addPersonalProject").style.display = "block";
        document.getElementById("addProfessionalExperience").style.display = "block";
        var completers = document.getElementsByClassName("completer");
        for (var x = 0; x < completers.length; x++){
          completers[x].style.display = "block";
        }
      }
    });
  },

  listenToEvents: function(){
    cv.deployed().then(function(instance) {
      instance.projectAdded({}, {fromBlock:0, toBlock:'latest'}).watch(function(error, event){
        var html = "<b>" + event.args.id.toNumber() + ": " + event.args.name + "</b> - " + event.args.description + "<br><br>";
        document.getElementById("spnProjects").innerHTML += html;
      });

      instance.experienceAdded({}, {fromBlock:0, toBlock:'latest'}).watch(function(error, event){
        var d = new Date( 1382086394000 ); //event.args.start_date.toNumber()
        var sdate = d.getDate() + '/' + (d.getMonth()+1) + '/' + d.getFullYear();

        var html = "<b>" + event.args.id.toNumber() + ": " + event.args.company + " - " + event.args.title + "</b><br>" + 
        event.args.technologies + "<br>" + 
        sdate.toString() + " - " + event.args.end_date.toNumber() + "<br><br>";
        document.getElementById("spnExperience").innerHTML += html;
      });

      instance.ideaAdded({}, {fromBlock:0, toBlock:'latest'}).watch(function(error, event){
        var id = event.args.id.toNumber();
        App.getIdea(id);
        var html = 
        '<div class="row">' + 
          '<div class="col-lg-12"><b>' + id + ": " + event.args.name + "</b> - " + event.args.description + "</div>" +
        '</div>' +  
        '<div class="row">' + 
          '<div class="col-lg-6 right">Fund <input type="text" id="fundProject' + event.args.id.toNumber() + '" style="width:100px;"> Ether</div>' + 
          '<div class="col-lg-6 left"><input type="button" ideaID="' + id + '" value="Add To Bounty" onclick="App.fundIdea(this)" style="width:250px;"></div>' + 
        '</div><br>' + 
        '<div class="row startHidden completer">' + 
          '<input type="button" onclick="App.completeIdea(' + id + ')" value="Mark ' + event.args.name + ' completed!">' + 
        '</div>' + 
        '<br><hr><br><br>';
        document.getElementById("projectIdeas").innerHTML += html;

        App.strapUI();
      });
    });
  },
  addPersonalProject: function(){
    cv.deployed().then(function(instance){
      var projectName = document.getElementById("newPersonalProjectName").value;
      var projectDesc = document.getElementById("newPersonalProjectDesc").value;
      instance.acceptProject(projectName, projectDesc, {from: account, gas: 200000});
    });
  },
  addProfessionalExperience: function(){
    cv.deployed().then(function(instance){
      var expCompany = document.getElementById("newProfessionalExperienceCompany").value;
      var expTitle = document.getElementById("newProfessionalExperienceTitle").value;
      var expTech = document.getElementById("newProfessionalExperienceTech").value;
      var expSDate = document.getElementById("newProfessionalExperienceSDate").value;
      var expEDate = document.getElementById("newProfessionalExperienceEDate").value;
      instance.acceptExperience(expCompany, expTitle, expTech, expSDate, expEDate, {from: account, gas: 200000});
    });
  },
  submitIdea: function(){
    cv.deployed().then(function(instance){
      var name = document.getElementById("projectIdeaName").value;
      var description = document.getElementById("projectIdeaDesc").value;
      instance.acceptNewIdea(name, description, {from: account, gas: 200000});
    });
  },
  fundIdea: function(btn){
    var id = btn.getAttribute("ideaID");
    var cinstance;
    cv.deployed().then(function(instance){
      cinstance = instance;
      var amount = web3.toWei(document.getElementById("fundProject" + id).value, "ether");
      return cinstance.sendTransaction({from: accounts[0], to: cinstance.address, value: amount}, function(error, tx){
        if (!error){
          instance.fundIdea(id, {from: account, gas:200000});
        }
      });
    });
  },
  getIdea: function(id){
    cv.deployed().then(function(instance){
      instance.getIdea(id, function(error, result){
        //console.log(result);
      });
    })
    // .then(function(result){
    //   //console.log(result);
    // });
  }
};

window.addEventListener('load', function() {
  // Checking if Web3 has been injected by the browser (Mist/MetaMask)
  if (typeof web3 !== 'undefined') {
    console.warn("Using web3 detected from external source. If you find that your accounts don't appear or you have 0 MetaCoin, ensure you've configured that source properly. If using MetaMask, see the following link. Feel free to delete this warning. :) http://truffleframework.com/tutorials/truffle-and-metamask")
    // Use Mist/MetaMask's provider
    window.web3 = new Web3(web3.currentProvider);
  } else {
    console.warn("No web3 detected. Falling back to http://localhost:8545. You should remove this fallback when you deploy live, as it's inherently insecure. Consider switching to Metamask for development. More info here: http://truffleframework.com/tutorials/truffle-and-metamask");
    // fallback - use your fallback strategy (local node / hosted node + in-dapp id mgmt / fail)
    window.web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));
  }

  App.start();
});
