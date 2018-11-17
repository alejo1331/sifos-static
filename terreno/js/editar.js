var editarTerreno = function () {
    return {
        map: "",
        gestorDibujo: "",
        poligono: null,
        area: "",
        perimetro: "",

        init: function () {
            this.map = new google.maps.Map(document.getElementById('mapsDiv'), {
                center: {lat: 4.1420000, lng: -73.6266400},
                zoom: 12
            });

            google.maps.Polygon.prototype.my_getBounds = function () {
                var bounds = new google.maps.LatLngBounds()
                this.getPath().forEach(function (element, index) {
                    bounds.extend(element)
                })
                return bounds
            }

            var json = $("#contenedorValores").val();
            var datosRegistro = JSON.parse(json);
            this.dibujarPoligonoExistente(datosRegistro);            
        },

        obtenerRegistroTerreno : function(nombre, perimetro, area){
            this.area = area;
            this.perimetro = perimetro;
            $("#dibujarPoligonoBtn").hide();
        },

        dibujarPoligonoExistente: function(puntos){                        
            this.poligono = new google.maps.Polygon({
                paths: puntos
            });
            this.poligono.setMap(editarTerreno.map);
        },

        dibujarPoligono: function () {
            if (this.map == undefined || this.map == "") {
                this.generarMensajeBasico("error", "Selección de polígono", "No fue posible obtener la información del mapa");                
                return;
            }
            $("#borrarPoligonoBtn").show();
            $("#dibujarPoligonoBtn").hide();
            editarTerreno.gestorDibujo = new google.maps.drawing.DrawingManager({
                drawingMode: google.maps.drawing.OverlayType.POLYGON,
                drawingControl: true,
                drawingControlOptions: {
                    position: google.maps.ControlPosition.TOP_CENTER,
                    drawingModes: ['polygon']
                },
                circleOptions: {
                    fillColor: '#ffff00',
                    fillOpacity: 1,
                    strokeWeight: 5,
                    clickable: false,
                    editable: true,
                    zIndex: 1
                }
            });

            google.maps.event.addListener(editarTerreno.gestorDibujo, 'polygoncomplete', function (poligono) {
                editarTerreno.poligono = poligono;

                editarTerreno.dibujarElementosPoligono();

                editarTerreno.gestorDibujo.setOptions({
                    drawingControl: false
                });
                editarTerreno.gestorDibujo.setDrawingMode(null);

            });

            editarTerreno.gestorDibujo.setMap(this.map);


        },

        borrarPoligono: function () {
            if (this.poligono != null) {
                this.poligono.setMap(null);
                this.poligono = null;
            }

            $("#dibujarPoligonoBtn").show();
            $("#borrarPoligonoBtn").hide();
            $("#areaPoligonoLbl").html("");
            $("#perimetroPoligonoLbl").html("");
        },

        dibujarElementosPoligono: function () {
            if (this.poligono != null) {
                area = google.maps.geometry.spherical.computeArea(this.poligono.getPath());
                perimetro = google.maps.geometry.spherical.computeLength(this.poligono.getPath());
                $("#areaPoligonoLbl").html(" " + area.toFixed() + " metros cuadrados (?)");
                $("#perimetroPoligonoLbl").html(" " + perimetro.toFixed() + " metros cuadrados (?)");
            }
        },
        registrarPoligono: function (municipio) {
            var puntos = editarTerreno.poligono.getPath().getArray()
            var coord = [];
            for (var i = 0; i < puntos.length; i++) {
                coord.push([puntos[i].lat(), puntos[i].lng()])
            }
            if (this.poligono == null) {
                this.generarMensajeBasico("warning", "Selección de polígono", "Debe seleccionar un polígono");                                                
                return;
            }
            var nombre = $("#nombreTerrenoTxt").val();
            if (nombre == "") {
                this.generarMensajeBasico("warning", "Selección de polígono", "Agregue el nombre del terreno");                
                return;
            }
            $.ajax({
                url: '/terreno/updpoligono',
                data: {
                    'points': JSON.stringify(coord),
                    'name': nombre,
                    'area': area.toFixed(),
                    'perimeter': perimetro.toFixed(),
                    'municipio': municipio,
                    'siembra': $('#siembra').val()
                },
                dataType: 'json',
                success: function (data) {
                    if (data.error == 'no') {
                        swal({
                            type: 'error',
                            title: 'Error...',
                            text: 'Ocurrio un error.',
                            footer: ''
                        })
                    }
                    else {
                        swal({
                            type: 'success',
                            title: 'Registro Satisfactorio',
                            text: '.',
                            footer: '',
                            confirmButtonColor: '#3085d6',
                            cancelButtonColor: '#d33',
                            confirmButtonText: 'Ok'
                        }).then((result) => {
                            if (result.value) {
                                location.href = '/terreno/seguimiento';
                            }
                        })

                    }
                }
            });
        },

        obtenerCiudadPorCentro: function () {
            if (this.poligono != null) {
                var centro = this.poligono.my_getBounds().getCenter();
                var ubicacion = {
                    lat: centro.lat(),
                    lng: centro.lng()
                }

                var geocoder = new google.maps.Geocoder;
                geocoder.geocode({'location': ubicacion}, function (results, status) {
                    if (status === 'OK') {
                        for (var i = 0; i < results.length; i++) {
                            if ($.inArray('locality', results[i].types) != -1 || $.inArray('administrative_area_level_2', results[i].types) != -1) {
                                var municipio = results[i].formatted_address.split(",")[0];
                                editarTerreno.registrarPoligono(municipio);
                                return;
                            }
                        }
                        this.generarMensajeBasico("error", "Registro de terreno", "No fue posible obtener información del municipio seleccionado");
                        
                    } else {
                        this.generarMensajeBasico("error", "Registro de terreno", "No fue posible obtener el municipio seleccionado");
                    }
                });                
            }
            return;
        },

        //psss, genera un mensaje normalito
        generarMensajeBasico: function(tipo, titulo, mensaje){
            swal({
                type : tipo,
                title : titulo,
                text : mensaje                
            });
            return;
        }
    }
}();


