(function() {

    $(window).load(function() {
        populateThemesSelect();
        initWithSelectedTheme();

        $('#theme-selector').on('change', function() {
            initWithSelectedTheme();
            this.blur();
        });

        $('#switch').on('change', function() {
            if ($('#switch').is(':checked')) {
                horizonal.enable();
            } else {
                horizonal.disable();
            }
        });
    });

    function initWithSelectedTheme() {
        var selectedTheme =  $("#theme-selector").val();
        horizonal.init(themes[selectedTheme].options);
    }

    function populateThemesSelect() {
        var select = $("#theme-selector");
        $.each(themes, function(name) {
            select.append($("<option />").val(name).text(name));
        });
    }

})();