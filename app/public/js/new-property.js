Dropzone.options.newPropertyForm = { // The camelized version of the ID of the form element

    // The configuration we've talked about above
    autoProcessQueue: false,
    autoDiscover: false,
    uploadMultiple: true,
    maxFiles: 6,
    parallelUploads: 6,
    paramName: 'images',
    //clickable: '#dz-preview',
    previewsContainer: '#dropzone-preview',
    addRemoveLinks: true,
    acceptedFiles: 'image/jpg,image/jpeg,image/png',
    url: '/property/save',
    error: function(file, msg) {
        console.log(msg);
    },
    accept: function(file, done) {
        $('.dz-message').css('background', '').find('span').html(Dropzone.prototype.defaultOptions.dictDefaultMessage);
        done();
    },
    init: function() {
        var myDropzone = this;

        $('#new-property-form *[type=submit]').click(function(e) {
            e.preventDefault();
            if (Dropzone.instances[0].files.length > 0) {
                if ($("#new-property-form").valid()) {
                    myDropzone.processQueue();
                }
            } else {
                $('.dz-message').css('background', '#9c172d').find('span').html('Necesitas subir al menos 1 imagen.');
                $("#new-property-form").valid()
            }
        });
        $(function() {
            $('.dz-default.dz-message').detach().insertAfter('#new-property-form .form-section input[type=file]');
            $('#new-property-form .form-section input[type=file]');
        });
    },
    success: function(files, response) {
        if (response.message) {
            localStorage.message = JSON.stringify(response.message);
        }
        location.href = response.url;
    }

}