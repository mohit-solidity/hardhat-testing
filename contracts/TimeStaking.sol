// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.28;
contract TimeStaking{
    uint8 public APY;
    bool locked;
    uint totalLiquidity;
    address public owner;
    address contractAddress;
    struct user{
        uint balance;
        uint startTime;
        uint stakedTime;
        bool staked;
    }
    mapping(address=>user) public userStatus;

    event UserStaked(address user,uint amount, uint timeInDays);
    event AmountWithdraw(address user, uint amount,uint reward,uint totalAmount);

    error InvalidAmount();
    error alreadyStaked(uint stakedAmount);

    constructor(uint8 _APY){
        owner = msg.sender;
        contractAddress = address(this);
        APY = _APY;
    }

    modifier onlyOwner(){
        require(msg.sender==owner || msg.sender==contractAddress,"Not Authorised");
        _;
    }
    modifier reenterrancyGuard{
        require(!locked,"No permission");
        locked = true;
        _;
        locked = false;
    }
    function changeAPY(uint8 _APY) public onlyOwner{
        require(_APY>0 && _APY<=30,"APY Limit Exceeded");
        APY = _APY;
    }
    function stake(uint time) public payable{
        if(msg.value==0 ether){
            revert InvalidAmount();
        }
        if(userStatus[msg.sender].staked){
            revert alreadyStaked(userStatus[msg.sender].balance);
        }
        uint timeStake = (block.timestamp + (time*1 days));
        userStatus[msg.sender] = user(msg.value,block.timestamp,timeStake,true);
        emit UserStaked(msg.sender, msg.value, time);
    }
    function calculateReward(address _user) internal view returns(uint){
        uint totalTime = block.timestamp - userStatus[_user].startTime;
        uint timeInDays = totalTime/1 days;
        uint userBalance = userStatus[_user].balance;
        uint reward = (userBalance*APY*timeInDays)/(100*365);
        return reward;
    }
    function unstake() public reenterrancyGuard{
        require(block.timestamp>=userStatus[msg.sender].stakedTime,"Funds Still Locked");
        require(userStatus[msg.sender].balance!=0,"No Active Stake");
        uint reward = calculateReward(msg.sender);
        uint balance = userStatus[msg.sender].balance;
        uint totalReward = balance+reward;
        (bool success, ) = payable(msg.sender).call{value:totalReward}("");
        require(success,"Transaction Failed");
        userStatus[msg.sender].balance = 0;
        userStatus[msg.sender].startTime = 0;
        userStatus[msg.sender].stakedTime = 0;
        userStatus[msg.sender].staked = false;
        emit AmountWithdraw(msg.sender, balance, reward, totalReward);
    }
    function seeUserReward(address _user) public view returns(uint,uint,uint,uint){
        user storage u = userStatus[_user];
        uint reward = calculateReward(_user);
        return (u.balance,u.startTime,u.stakedTime,reward);
    }
    function ownerWithdraw() public onlyOwner{
        (bool success,) = payable(owner).call{value:address(this).balance}("");
        require(success,"Transaction Failed");
    }
}