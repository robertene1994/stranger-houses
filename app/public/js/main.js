$(function() {
    $('select').niceSelect();
    initModals();
    initValidation();
    initScrollNavbar();
    initGrowl();

    //Methods
    function initModals() {
        const animationDuration = 250;
        $('dialog.modal').css('animation-duration', `${animationDuration}ms`);
        $('.modal-trigger').click(function() {
            const $bt = $(this);
            const $modal = $($bt.data('modal'));
            const $focus = $($bt.data('modal-focus'));
            $('body').css('overflow', ' hidden');
            $modal.attr('open', 'open');
            $focus.focus();
        });
        $('.modal-close').click(function() {
            const $modal = $(this).parents('dialog.modal');
            $modal.addClass('close');
            $('body').css('overflow', '');
            setTimeout(() => $modal.removeClass('close').removeAttr('open'), animationDuration);
        });
    }

    function initValidation() {
        $('form').each(function() {
            const $form = $(this);
            const options = {
                "rules": {},
                "submitHandler": function(form) {
                    const $form = $(form);
                    if (($form).hasClass('form-ajax')) {
                        $form.find('.error-general').remove();
                        const requestParams = {
                            "method": $form.attr('method'),
                            "url": $form.attr('action'),
                        };
                        if (requestParams.method.toLowerCase() == 'post') {
                            requestParams.data = $form.serialize()
                        } else if (requestParams.method.toLowerCase() == 'get') {
                            const formSerialized = $form.serialize();
                            if (formSerialized)
                                requestParams.url = requestParams.url + '/';
                        }
                        $.ajax(requestParams).always(function(response) {
                            if (response.message !== undefined && (response.message.severity === 'error' || response.message.severity === 'warning')) {
                                $form.prepend(`<div class="error-general">${response.message.text}</div>`)
                                $form.find('input, select, textarea').first().focus();
                            } else {
                                if (response.message) {
                                    localStorage.message = JSON.stringify(response.message);
                                }
                                if (response.url) {
                                    location.href = response.url;
                                } else {
                                    location.reload();
                                }
                            }
                        });
                    } else {
                        $form.submit();
                    }
                }
            };
            $form.find('input, textarea').each(function() {
                const $field = $(this);
                const validations = $field.data('validations');
                if (validations) {
                    options.rules[$field.attr('name')] = validations;
                }
            });
            $form.validate(options);
        });
    }

    function initScrollNavbar() {
        const transitionDuration = 200;
        $(window).scroll(function(event) {
            const $navbar = $('.navbar');
            const scroll = $(window).scrollTop();
            if (scroll > 0) {
                $navbar.addClass('navbar-scroll');
            } else {
                $navbar.addClass('navbar-no-scroll').removeClass('navbar-scroll');
                setTimeout(() => $navbar.removeClass('navbar-no-scroll'), transitionDuration);
            }
        });
    }

    function initGrowl() {
        const $growl = $('dialog.growl');
        let msg = localStorage['message'];
        if (msg) {
            msg = JSON.parse(msg);
            $growl.addClass(msg.severity).html(msg.text).attr('open', '');
            localStorage.removeItem('message');
        }
        $growl.click(function() {
            $(this).removeAttr('open');
        });
    }
});

Dropzone.prototype.defaultOptions.dictDefaultMessage = "Pulsa aquí o arrastra las imágenes que quieres subir.";
Dropzone.prototype.defaultOptions.dictFallbackMessage = "Tu navegador no soporta la funcionalidad 'drag and drop'.";
Dropzone.prototype.defaultOptions.dictFallbackText = "Por favor pulsa sobre el botón para subir imágenes como en los viejos tiempos..";
Dropzone.prototype.defaultOptions.dictFileTooBig = "El archivo es demasiado grande, ({{filesize}}MiB). Tamaño máximo: {{maxFilesize}}MiB.";
Dropzone.prototype.defaultOptions.dictInvalidFileType = "No puede subir archivos de este tipo.";
Dropzone.prototype.defaultOptions.dictResponseError = "Un error desconocido ha ocurrido. El servidor respondió con el código de estado {{statusCode}}.";
Dropzone.prototype.defaultOptions.dictCancelUpload = "Cancelar subida";
Dropzone.prototype.defaultOptions.dictCancelUploadConfirmation = "¿Estás seguro de que quieres cancelar la subida?";
Dropzone.prototype.defaultOptions.dictRemoveFile = "x";
Dropzone.prototype.defaultOptions.dictMaxFilesExceeded = "No puedes subir más archivos.";