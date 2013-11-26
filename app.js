var page = new WebPage();

page.onCallback = function(data) {

	if (data === "finished") {    
		console.log("Imagens criadas, ");    
		createVideo();    
		return;  
	}  

	if (data === "loaded") {    
		console.log("Starting to create images...");    
		return; 
	}  

	console.log("Creating image number: " + data + "...");  
	
	// Ignorando a primeira imagem:
	if (data !== 0) { 
		page.render("./imagens/" + (data < 10 ? '0' + data : data)+ '.jpeg');  
	}

}

page.open('./simple.html', function(status) {  
	if (status !== 'success') {    
		console.log('Unable to access network');  
	} else {    
		console.log('Page loaded, loading Hyperlapse data...');  
	}
}); 
