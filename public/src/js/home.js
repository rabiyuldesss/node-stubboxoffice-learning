
(function ($, root, undefined) {
	$(function () {
		'use strict';
		$(document).ready(function() {






			// Homepage Slider
			var $main = $("#main-slider > .inner");
			var $sport = $('#sport-slider > .inner');
			var $concert = $('#concert-slider > .inner');
			var $theatre = $('#theatre-slider > .inner');

			$main.slick({
				adaptiveHeight: true,
				fade: true,
				speed: 350,

				autoplay: false,
				autoplaySpeed: 5000,

				arrows: true,
				prevArrow: $('#main-slider #left-arrow-btn'),
				nextArrow: $('#main-slider #right-arrow-btn'),

				centerMode: true,
				useCSS: true,
				useTransform: true,

				infinite: true,
				slidesToShow: 1,
				slidesToScroll: 1,

				swipeToSlide: true,
				touchMove: true,
			});

			$sport.slick({
				infinite: false,
				speed: 300,
				slidesToShow: 5,
				slidesToScroll: 5,
				prevArrow: $('#sport-slider #left-arrow-btn'),
				nextArrow: $('#sport-slider #right-arrow-btn'),
				responsive: [
					{
						breakpoint: 1024,
						settings: {
							slidesToShow: 4,
							slidesToScroll: 4,
							infinite: true
						}
					},
					{
						breakpoint: 600,
						settings: {
							slidesToShow: 2,
							slidesToScroll: 2
						}
					},
					{
						breakpoint: 480,
						settings: {
							slidesToShow: 1,
							slidesToScroll: 1
						}
					}
				]
			});

			$concert.slick({
				infinite: false,
				speed: 300,
				slidesToShow: 5,
				slidesToScroll: 5,
				prevArrow: $('#concert-slider #left-arrow-btn'),
				nextArrow: $('#concert-slider #right-arrow-btn'),
				responsive: [
					{
						breakpoint: 1024,
						settings: {
							slidesToShow: 4,
							slidesToScroll: 4,
							infinite: true
						}
					},
					{
						breakpoint: 600,
						settings: {
							slidesToShow: 2,
							slidesToScroll: 2
						}
					},
					{
						breakpoint: 480,
						settings: {
							slidesToShow: 1,
							slidesToScroll: 1
						}
					}
				]
			});

			$theatre.slick({
				infinite: false,
				speed: 300,
				slidesToShow: 5,
				slidesToScroll: 5,
				prevArrow: $('#theatre-slider #left-arrow-btn'),
				nextArrow: $('#theatre-slider #right-arrow-btn'),
				responsive: [
					{
						breakpoint: 1024,
						settings: {
							slidesToShow: 4,
							slidesToScroll: 4,
							infinite: true
						}
					},
					{
						breakpoint: 600,
						settings: {
							slidesToShow: 2,
							slidesToScroll: 2
						}
					},
					{
						breakpoint: 480,
						settings: {
							slidesToShow: 1,
							slidesToScroll: 1
						}
					}
				]
			});





		});
	});
})(jQuery, this);