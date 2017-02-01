var container = {
			offset: function()
			{
				return { top: 107,
						 left:200};
			},
			scrollLeft: function()
			{
				return 0;
			},
			scrollTop: function()
			{
				return 0;
			}
		};

var elts = [
			{
				offset: function(){ return { top: 113, left: 210};},
				width: function(){ return 160;},
				outerHeight: function(){return 32;},
				data:function(selector){return undefined;}
			},
			{
				offset: function(){ return { top: 113, left: 410};},
				width: function(){ return 160;},
				outerHeight: function(){return 32;},
				data:function(selector){return undefined;}
			},
			{
				offset: function(){ return { top: 113, left: 631};},
				width: function(){ return 160;},
				outerHeight: function(){return 32;},
				data:function(selector){return undefined;}
			},
			{
				offset: function(){ return { top: 113, left: 852};},
				width: function(){ return 26;},
				outerHeight: function(){return 35;},
				data:function(selector){return undefined;}
			},
			{
				offset: function(){ return { top: 113, left: 928};},
				width: function(){ return 160;},
				outerHeight: function(){return 32;},
				data:function(selector){return undefined;}
			},
			{
				offset: function(){ return { top: 113, left: 1128};},
				width: function(){ return 26;},
				outerHeight: function(){return 35;},
				data:function(selector){return undefined;}
			},
			{
				offset: function(){ return { top: 161, left: 210};},
				width: function(){ return 160;},
				outerHeight: function(){return 32;},
				data:function(selector){return undefined;}
			},
			{
				offset: function(){ return { top: 161, left: 410};},
				width: function(){ return 160;},
				outerHeight: function(){return 32;},
				data:function(selector){return undefined;}
			},
			{
				offset: function(){ return { top: 161, left: 852};},
				width: function(){ return 160;},
				outerHeight: function(){return 32;},
				data:function(selector){return undefined;}
			},
			{
				offset: function(){ return { top: 161, left: 1052};},
				width: function(){ return 26;},
				outerHeight: function(){return 35;},
				data:function(selector){return undefined;}
			}
		];
// sample data for points and open objects on X axis
var points1 = [ {x: 1, blocked: false,connectedPts: []},
				{x: 2, blocked: false, connectedPts: []}, 
				{x: 3, blocked: false, connectedPts: []}, 
				{x: 4, blocked: false, connectedPts: []}];

var points2 = [ {x: 1, blocked: false,connectedPts: []},
				{x: 2, blocked: false, connectedPts: []}, 
				{x: 3, blocked: false, connectedPts: []}, 
				{x: 4, blocked: false, connectedPts: []}];

var points3 = [ {x: 1, blocked: false,connectedPts: []},
				{x: 2, blocked: false, connectedPts: []}, 
				{x: 3, blocked: false, connectedPts: []}, 
				{x: 4, blocked: false, connectedPts: []}];

var points4 = [ {x: 1, blocked: false,connectedPts: []},
				{x: 2, blocked: false, connectedPts: []}, 
				{x: 3, blocked: false, connectedPts: []}, 
				{x: 4, blocked: false, connectedPts: []},
				{x: 5, blocked: false, connectedPts: []},];

var points5 = [ {x: 1, blocked: false,connectedPts: []},
				{x: 2, blocked: false, connectedPts: []}, 
				{x: 3, blocked: false, connectedPts: []}, 
				{x: 4, blocked: false, connectedPts: []},
				{x: 5, blocked: false, connectedPts: []},
				{x: 6, blocked: false, connectedPts: []},
				{x: 7, blocked: false, connectedPts: []},
				{x: 8, blocked: false, connectedPts: []}];

var points6 = [ {x: 1, blocked: false,connectedPts: []},
				{x: 2, blocked: false, connectedPts: []}, 
				{x: 3, blocked: false, connectedPts: []}, 
				{x: 4, blocked: false, connectedPts: []},
				{x: 5, blocked: false, connectedPts: []},
				{x: 6, blocked: false, connectedPts: []},
				{x: 7, blocked: false, connectedPts: []},
				{x: 8, blocked: false, connectedPts: []},
				{x: 9, blocked: false, connectedPts: []},
				{x: 10, blocked: false, connectedPts: []}];

var points7 = [ {x: 5, blocked: false, connectedPts: []},
				{x: 2, blocked: false, connectedPts: []}, 
				{x: 3, blocked: false, connectedPts: []},
				{x: 9, blocked: false, connectedPts: []}, 
				{x: 4, blocked: false, connectedPts: []},
				{x: 6, blocked: false, connectedPts: []},
				{x: 7, blocked: false, connectedPts: []},
				{x: 1, blocked: false,connectedPts: []},
				{x: 8, blocked: false, connectedPts: []},
				{x: 10, blocked: false, connectedPts: []}];

var openObjects1 = [{left: 1.4, right: 2.7}];

var openObjects2 = [{left: 1.4, right: 3.7}];

var openObjects3 = [];

var openObjects4 = [{left: 2.4, right: 3.7}];

var openObjects5 = [{left: 2.4, right: 4.7},{left: 6.4, right: 7.7 }];

var openObjects6 = [{left: 3.4, right: 6.7},{left: 9.4, right: 10.7 }];

// sample data for points and open objects on Y axis
var pointsY1 = [ {y: 1, blocked: false,connectedPts: []},
				{y: 2, blocked: false, connectedPts: []}, 
				{y: 3, blocked: false, connectedPts: []}, 
				{y: 4, blocked: false, connectedPts: []}];

var pointsY2 = [ {y: 1, blocked: false,connectedPts: []},
				{y: 2, blocked: false, connectedPts: []}, 
				{y: 3, blocked: false, connectedPts: []}, 
				{y: 4, blocked: false, connectedPts: []}];

var pointsY3 = [ {y: 1, blocked: false,connectedPts: []},
				{y: 2, blocked: false, connectedPts: []}, 
				{y: 3, blocked: false, connectedPts: []}, 
				{y: 4, blocked: false, connectedPts: []}];

var pointsY4 = [ {y: 1, blocked: false,connectedPts: []},
				{y: 2, blocked: false, connectedPts: []}, 
				{y: 3, blocked: false, connectedPts: []}, 
				{y: 4, blocked: false, connectedPts: []},
				{y: 5, blocked: false, connectedPts: []},];


var openObjectsY1 = [{top: 1.4, bottom: 2.7}];

var openObjectsY2 = [{top: 1.4, bottom: 3.7}];

var openObjectsY3 = [];

var openObjectsY4 = [{top: 2.4, bottom: 3.7}]
