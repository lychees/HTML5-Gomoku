gameData={
    prefix: 'yyjhao.gomoku.',
    records: {},
    addRecord: function(name, defaultVal,applyFunc){
        this.records[name]=defaultVal;
        var func;
        if(!applyFunc){
            func=function(){};
        }
        else{
            func=applyFunc;
        }
        Object.defineProperty(this, name, {
            get: function(){
                return localStorage[this.prefix+name];
            },
            set: function(val){                
                localStorage[this.prefix+name] = val;
                func(val);
            }
        });
    },
    ini: function(){
        for(var i in this.records){
            this[i]=this.records[i];
        }
    },
    apply: function(){
        for (var i in this.records){
            this[i]=this[i];
        }
    }
};

gameData.addRecord('firstTime','firstTime');

function refresh(){
    if(gameData['mode']=='vshuman'){
        $('.vs-human').show();
        if(gameData['net']=='online'){
            $('.online').show();
            if(gameData['create_or_join']=='create'){
                $('.create').show();
                $('.join').hide();
            }else{
                $('.join').show();
                $('.create').hide();
            }
        }else{
            $('.online').hide();
        }
        $('.vs-computer').hide();
    }else{
        $('.vs-computer').show();
        $('.vs-human').hide();
    }
}

gameData.addRecord('mode', 'vscomputer', function(val){
    $('#mode-select input[value="'+val+'"]').attr('checked',true);
    $('#mode-select input[type="radio"]').checkboxradio('refresh');
    refresh();
});
gameData.addRecord('net', 'online', function(val){
    $('#net-select input[value="'+val+'"]').attr('checked',true);
    $('#net-select input[type="radio"]').checkboxradio('refresh');
    refresh();
});
gameData.addRecord('create_or_join', 'create', function(val){
    $('#create-or-join-select input[value="'+val+'"]').attr('checked',true);
    $('#create-or-join-select input[type="radio"]').checkboxradio('refresh');
    refresh();
});
gameData.addRecord('room', "1", function(val){
    $('#room-input input[type="text"]').val(val);
});
gameData.addRecord('nickname', "Noname", function(val){
    $('#nickname-input input[type="text"]').val(val);
});



gameData.addRecord('color', 'black', function(val){
    $('#color-select input[value="'+val+'"]').attr('checked',true);
    $('#color-select input[type="radio"]').checkboxradio('refresh');
});
gameData.addRecord('level', 'medium', function(val){
    $('#level-select input[value="'+val+'"]').attr('checked',true);
    $('#level-select input[type="radio"]').checkboxradio('refresh');
});

gameData.load=function(){
    if(!this.firstTime){
        this.ini();
    }
    this.apply();
};
