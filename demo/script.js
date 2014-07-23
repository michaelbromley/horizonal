(function() {

    $(window).load(function() {
        populateThemesSelect();
        initWithSelectedTheme();

        $(window).on('keypress', function(e) {
            if (e.which === 101) {
                horizonal.enable();
            }
            if (e.which === 100) {
                horizonal.disable();
            }
        });

        $('#theme-selector').on('change', function() {
            initWithSelectedTheme();
            this.blur();
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