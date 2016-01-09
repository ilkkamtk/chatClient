/*jshint browser: true, jquery: true*/
var uID = 0;

$(function(){
    function getMessages(){
        $.getJSON('http://users.metropolia.fi/~ilkkamtk/chatApi/threads', function(resp){
            //console.log(showThread(resp));
            $('#messages').empty();
            resp.reverse();
            showThread(resp, $('#messages'));
            var timer = setTimeout(getMessages, 5000);
        });
    }

    function showThread(thread, target){
        $.each(thread, function(key, message){
            var parent_div = $('<div class="media" data-id="'+message.mID+'"></div>').appendTo(target);

            var kuva = $('<div class="media-left"><img class="media-object img-thumbnail" src="'+message.thumbnail+'" alt="avatar" onerror="checkImage(this)"></div>').appendTo(parent_div);
            var mediaBody = $('<div class="media-body"></div>').appendTo(parent_div);
            var otsikko = $('<h4 class="media-heading">'+message.name+'</h3>').appendTo(mediaBody);

            var ero = moment.unix()-message.time;
            var aika = '';
            if (ero < 60){
                    aika = moment.unix(message.time, 'ss').fromNow();
            } else
            if (ero < 3600){
                    aika = moment.unix(message.time, 'mm').fromNow();
            } else
            if (ero < 60*60*24){
                    aika = moment.unix(message.time, 'HH').fromNow();
            } else {
                    aika = moment.unix(message.time, 'DD').fromNow();
            }
            var maika = $('<span class="text-muted">'+aika+'</span>').appendTo(mediaBody);
            $('<br>').appendTo(mediaBody);
            var viesti = $('<span class="viesti">'+message.message+'</span>').appendTo(mediaBody);
            var napit = $('<div class="btn-group pull-right" role="group" aria-label="toiminnot"></div>').appendTo(mediaBody);
            var vastaa = $('<button class="btn btn-default btn-xs" data-toggle="modal" data-target="#replyModal" data-mID="'+message.mID+'">Vastaa</button>').appendTo(napit);
            vastaa.click(function(){
                $('input[name="parent"]').attr('value', $(this).attr('data-mID'));
            });

            if(uID == message.user_id){

                var muokkaa = $('<button class="btn btn-info btn-xs" data-toggle="modal" data-target="#modifyModal" data-mID="'+message.mID+'">Muokkaa</button>').appendTo(napit);

                muokkaa.click(function(){
                    //console.log($(this).parent().parent().children('span:not(.text-muted)').text());
                    $('#modifyModal textarea').text($(this).parent().parent().children('.viesti').text());
                    $('input[name="mID"]').attr('value', $(this).attr('data-mID'));
                });

                var poista = $('<button class="btn btn-danger btn-xs" data-mID="'+message.mID+'">Poista</button>').appendTo(napit);
                poista.click(function(){
                    $.ajax({
                        url: 'http://users.metropolia.fi/~ilkkamtk/chatApi/messages/'+poista.attr('data-mID'),
                        type: 'DELETE',
                        success: function(){
                            $('[data-id="'+message.mID+'"]').remove();
                        },
                        error: function(data, textStatus, errorThrown) {
                          alert('Ei voi poistaa.');
                        },
                        dataType: 'json'
                    });
                });
            }



            var viiva = $('<hr>').appendTo(mediaBody);
            //console.log(message);
            if(message.children){
                //console.log($('[data-id="'+message.children[0].parent+'"]'));
                showThread(message.children, $('[data-id="'+message.children[0].parent+'"] .media-body:first'));
            }
        });
    }

    //console.log($('#messageModal form'));

    $('#messageModal form').submit(function(evt){
        evt.preventDefault();
        var data = $(this).serialize();
        //console.log(data);
        $.post('http://users.metropolia.fi/~ilkkamtk/chatApi/messages', data, function(resp){
            //console.log(showThread(resp));
            $('#messageModal').modal('hide');
            getMessages();
        }, 'json');
    });

    $('#replyModal form').submit(function(evt){
        evt.preventDefault();
        var data = $(this).serialize();
        //console.log(data);
        $.post('http://users.metropolia.fi/~ilkkamtk/chatApi/threads', data, function(resp){
            //console.log(showThread(resp));
            $('#replyModal').modal('hide');
            getMessages();
        }, 'json');
    });

    $('#modifyModal form').submit(function(evt){
        evt.preventDefault();
        var data = $(this).serialize();
        //console.log(data);
        $.ajax({
            method: 'PUT',
            url:'http://users.metropolia.fi/~ilkkamtk/chatApi/messages',
            data: data,
            success: function(resp){
                //console.log(showThread(resp));
                $('#modifyModal').modal('hide');
                getMessages();
            },
            dataType: 'json'
        });
    });


    $('#loginForm').submit(function(evt){
        evt.preventDefault();
        var data = $(this).serialize();
        $.post('http://users.metropolia.fi/~ilkkamtk/chatApi/login', data, function(resp){
            uID = resp.uID;
            $('input[name="uID"]').attr("value", resp.uID);
            $('input[name="name"]').attr("value", resp.name);
            getProfile(resp);
            getMessages();
        }, 'json').fail( function(data, textStatus, errorThrown) {
            $('#loginForm').append('<p class="alert alert-danger">Käyttäjänimeä ei löydy.</p>');
          });
    });

    $('#signInForm').submit(function(evt){
        evt.preventDefault();
        var data = $(this).serialize();
        $.post('http://users.metropolia.fi/~ilkkamtk/chatApi/users', data, function(resp){
            uID = resp.uID;
            $('input[name="uID"]').attr("value", resp.uID);
            $('input[name="name"]').attr("value", resp.name);
            getProfile(resp);
            getMessages();
        }, 'json').fail( function(data, textStatus, errorThrown) {
            $('#signInForm').append('<p class="alert alert-danger">Käyttäjä on jo olemassa.</p>');
        });
    });

     $('#imageForm').submit(function(evt){
        var options = {
            type: 'POST',
            dataType: 'json',
            url:        'http://users.metropolia.fi/~ilkkamtk/chatApi/images',
            success:    function(resp) {
                    $('#imageModal').modal('hide');
                    $('.media-object').first().attr('src', $('.media-object').first().attr('src') + '?' + Math.random());
                    getMessages();
                },
            error: function(data, textStatus, errorThrown) {
              $('#signInForm').append('<p class="alert alert-danger">Virhe.</p>');
            }
        };

        evt.preventDefault();
        $(this).ajaxSubmit(options);
    });

    function getProfile(resp){
        $('#profiili').html($('<h2>Profiili</h2>'+
                    '<div class="panel panel-default">'+
                        '<div class="panel-body">'+
                              '<div class="media">'+
                                  '<div class="media-body"><h4>'+resp.name+'</h4><img class="media-object img-thumbnail center-block" src="'+resp.profileImage+'.jpg" alt="avatar" onerror="checkImage(this)"></div>'+

                                  '</div>'+
                              '<div class="btn-group btn-group-justified" role="group" aria-label="toiminnot">'+
                              '<div class="btn-group" role="group">'+
                              '<button type="button" class="btn btn-default btn-sm" data-toggle="modal" data-target="#imageModal">Vaihda kuva</button>'+
                              '</div>'+
                              '<div class="btn-group" role="group">'+
                              '<button type="button" class="btn btn-primary btn-sm" data-toggle="modal" data-target="#messageModal">Uusi viesti</button>'+
                              '</div>'+
                              '<div class="btn-group" role="group">'+
                              '<button type="button" class="btn btn-danger btn-sm" data-uid="'+resp.uID+'">Poista minut</button>'+
                              '</div>'+
                              '</div>'+
                        '</div>'+
                    '</div>'));
        $('#profiili .btn-danger').click(function(){
            var mID = $(this).attr('data-uid');
            $.ajax({
                method: 'DELETE',
                url:'http://users.metropolia.fi/~ilkkamtk/chatApi/users/'+uID,
                success: function(){
                    location.reload();
                },
                dataType: 'json'
            });
        });
    }

});

function checkImage(image){
    image.onerror = "";
    image.src = "http://placekitten.com/65/64";
    return true;
}
