pragma solidity ^0.4.8;

import "./CVExtender.sol";
import "./mortal.sol";

contract ethCV is CVExtender, mortal {
    event receivedFunds(address _from, uint256 _amount);
    event projectAdded(uint id, string name, string description);
    event experienceAdded(uint id, string company, string title, string technologies, int start_date, int end_date);
    event ideaAdded(uint id, address from, string name, string description, string url, int funds);
    event ideaFunded(uint id, uint amount);    
    event ideaCompleted(uint id, string url);
    event debug(string msg);

    uint projectId;
    struct Project {
        string name;
        string description;
    }
    
    uint experienceId;
    struct Experience {
        string company;
        string title;
        string technologies;
        int start_date;
        int end_date;
    }

    uint ideaId;
    struct Idea {
        address from;
        string name;
        string description;
        string url;
        uint funds;
        bool complete;
    }
    
    mapping(uint => Project) projects;
    mapping(uint => Experience) experiences;
    mapping(uint => Idea) ideas;

    function toString(address x) returns (string) {
        bytes memory b = new bytes(20);
        for (uint i = 0; i < 20; i++)
            b[i] = byte(uint8(uint(x) / (2**(8*(19 - i)))));
        return string(b);
    }
    function isOwner(address test) constant returns (bool){
        return test == owner;
    }

    function acceptProject(string name, string description) onlyowner returns (bool) {
        projects[projectId] = Project(name, description);
        projectAdded(projectId, name, description);
        projectId++;
        return true;
    }
    function acceptExperience(string company, string title, string technologies, int start_date, int end_date) onlyowner returns (bool) {
        experiences[experienceId] = Experience(company, title, technologies, start_date, end_date);
        experienceAdded(experienceId, company, title, technologies, start_date, end_date);
        experienceId++;
        return true;
    }
    function acceptNewIdea(string name, string description) returns (bool) {
         ideas[ideaId] = Idea(msg.sender, name, description, "", 0, false);
         ideaAdded(ideaId, msg.sender, name, description, "", 0);
         ideaId++;
         return true;
    }
    function getIdea(uint ideaId) constant returns (address from, string name, string description, string url, uint funds, bool complete){
        Idea idea = ideas[ideaId];
        return (idea.from, idea.name, idea.description, idea.url, idea.funds, idea.complete);
    }
    function fundIdea(uint id) payable public returns (bool) {
        Idea idea = ideas[id];
        if (idea.from != address(0) && idea.complete == false){
            idea.funds = idea.funds + msg.value;
            ideaFunded(id, msg.value);
            return true;
        }
    }
    function completeIdea(uint id, string url) onlyowner returns (bool) {
        Idea idea = ideas[id];
        if (idea.complete == false){
            bool sent = owner.send(idea.funds);
            if (!sent){
                revert();
                return false;
            }
            else {
                idea.url = url;
                ideaCompleted(id, url);
                return true;
            }
        }
    }

    function getAddress() constant returns(string) {
        return "https://devin-m-d.github.io/ethereumcv/";
    }
    function getDescription() constant returns(string) {
        return "A smart contract resume showing ethereum certification";
    }
    function getTitle() constant returns(string) {
        return "Ethereum CV";
    }
    function getAuthor() constant returns(string, string) {
        return ("Devin", "downer.devin@gmail.com");
    }

    function() payable {
       if(msg.value > 0) {
           receivedFunds(msg.sender, msg.value);
       }
   }

}
