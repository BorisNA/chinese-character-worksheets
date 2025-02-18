/*
*	Creates Pdf from given params.
*	characters, charPinyin : String arrays
*	numberOfGrayscaleSigns : int
*	writePinyin, useGridlines, writeName : Booleans
*	docTitle, filename, wayOfRetrieval : Strings
*	tianyingzhangFont: Boolean
*	groupBy: int
*/
function createPdf(docTitle, characters, numberOfGrayscaleSigns, pasteSoImages, writePinyin, useGridlines, writeName, filename, charPinyin, wayOfRetrieval, tianyingzhangFont, groupBy ){
	// make filename "filesystem-secure"
		filename = filename.replace(/[^a-z0-9öäüß\s\-\_\u4E00-\u9FFF]/gi, '');
		filename = filename == "" ? "my-chinese-exercise" : filename;
	// notify user
		$("#substatus").html("Starting to create your PDF");
	// new jsPDF-doc
		var doc = new jspdf.jsPDF();
	// import font to jsPDF
		$("#substatus").html("Adding Chinese font");
		doc.addFileToVFS('AR PL UKai CN.ttf', ArPlUkaiCnBase64);
		doc.addFont('AR PL UKai CN.ttf', 'AR PL UKai CN', 'normal');
		doc.addFileToVFS('tianyingzhang.ttf', tianyingzhangBase64);
		doc.addFont('tianyingzhang.ttf', 'tianyingzhang', 'normal');
		$("#substatus").html("Adding Pīnyīn font");
		doc.addFileToVFS('NotoSans-Regular.ttf', pinyinFontBase64);
		doc.addFont('NotoSans-Regular.ttf', 'Noto Sans', 'normal');
	// set style of ends of lines (for good looking corners)
		doc.setLineCap("projecting");
	// draw character lines: 11 characters per page, 11 characters per line
		$("#substatus").html("Writing character lines (line <span class='amountDone'>0</span>/" + characters.length + ")");
		var i;
		var j;
		var xUpLeft = 14;								// x position of the first character line on a page = left indent
		var charLineHeight = 17;						// height of a character line
		var charCellWidth = 17;							// width of a character cell
		var yUpLeft = 18;								// y position of the first character line on a page = top indent + distance between character lines
		var charLineDistance = charLineHeight + 0.0;	// distance between the UPPER strokes of the char lines
		var charLineDistanceEx = 2.0;
		var thisLineYUpLeft;
		var curPage = 1;		// current page
		var charsPerPage = 14;
		var imgProp;
		var totalPages = Math.ceil(characters.length/charsPerPage); // total number of pages (pre-computed)
		for(i = 0; i < characters.length; ++i){
			if(i%charsPerPage == 0){ // if we're at the beginning of a page
				if(i != 0){ // if reached beginning of new page (i \in {9,19,29,...}) => add new page (& focus on it)
					doc.addPage();
					curPage++;
				}
				// line on top of the page
				doc.line(xUpLeft, 15, 201, 15);
				// write "姓名：" if the user wanted it
				if(writeName){
					doc.setFont('AR PL UKai CN');
					doc.setFontSize(11); //in pt
					doc.text("姓名：", xUpLeft, 16);
				}
				// write doc title
					doc.setFont('AR PL UKai CN');
					doc.setFontSize(14); //in pt
					doc.text(docTitle, 105, 13, 'center'); // A4_width/2 = 210 mm/2 = 105
				// write page number
					doc.setFont('Noto Sans');
					doc.setFontSize(10); //in pt
					//doc.text("第" + curPage + "页，共" + totalPages + "页", 201, 16, 'right'); // 201 is 210-rightIndent
					doc.text(curPage + "/" + totalPages, 201, 13, 'right'); // 201 is 210-rightIndent
 				// copyright on the bottom
					doc.setFont('Noto Sans');
					doc.setFontSize(10); //in pt
					var copyrightText = 'Create your own Chinese worksheets for free: www.is.gd/ch_ex';
					var copyrightTextWidth = doc.getTextWidth(copyrightText) + 2;
					var copyrightTextHeight = doc.internal.getLineHeight()/doc.internal.scaleFactor + 1;
					doc.text(copyrightText, 105, yUpLeft + charLineDistance * (charsPerPage+1) + Math.floor( charsPerPage/2 ) * charLineDistanceEx, 'center');
					doc.link(105 - copyrightTextWidth/2,
						yUpLeft + charLineDistance * (charsPerPage+1) + Math.floor( charsPerPage/2 ) * charLineDistanceEx - copyrightTextHeight,
						copyrightTextWidth,
						copyrightTextHeight,
						{ url: 'https://is.gd/ch_ex'});
			}
			thisLineYUpLeft = yUpLeft + (i%charsPerPage) * charLineDistance + ( Math.floor((i%charsPerPage)/groupBy) * charLineDistanceEx );
			// paste hanzi-write Stroke Order SVGs
				if(pasteSoImages){
					// this is the div which contains the stroke order of the character "characters[i]"
					var charSvgs = document.getElementById('strokeOrderSvgs-' + characters[i]).childNodes;
					// draw every "stroke order element" (= the partial character after k strokes)
					for(var k = 0; k < charSvgs.length; k++){
						svg2pdf(charSvgs[k], doc, {
							xOffset: xUpLeft + 19 + k * 7.2,
							yOffset: thisLineYUpLeft - 7.1,
							scale: 1
						});
					}
				}
			// gridlines - part 1
				if(useGridlines){
					doc.setLineDash( [1, 1] );
					doc.setDrawColor("D0D0D0");
					// horizontal lines for all of the characters in the character line
					doc.line(	xUpLeft,
								thisLineYUpLeft + 0.5 * charLineHeight,
								xUpLeft + 11 * charCellWidth,
								thisLineYUpLeft + 0.5 * charLineHeight);
					doc.setDrawColor("000000");
				doc.setLineDash( );
				}
			// write pinyin
				if(writePinyin){
					doc.setFont('Noto Sans');
					doc.setFontSize(12); //in pt
					doc.text(charPinyin[i], xUpLeft, thisLineYUpLeft-1.5); // "-1.5" looks better
				}
			// single characters along the character line
			if( tianyingzhangFont )
				doc.setFont('tianyingzhang');
			else
			doc.setFont('AR PL UKai CN');
			doc.setFontSize(40); //in pt
			for(j = 0; j < 12; ++j){ // 11 chars per line
				// gridlines - part 2
					if(useGridlines && j < 11){
						doc.setDrawColor("D0D0D0");
						doc.setLineDash( [1, 1] );
						// vertical line per character
						doc.line(
							xUpLeft + (j+0.5) * charCellWidth,	// x1
							thisLineYUpLeft,					// y1
							xUpLeft + (j+0.5) * charCellWidth,	// x2
							thisLineYUpLeft + charLineHeight);	// y2
						// 2 diagonal lines per character
							doc.setLineCap("round");
							// "⭸" left top --> right bottom
							doc.line(
								xUpLeft + j * charCellWidth,		// x1
								thisLineYUpLeft,					// y1
								xUpLeft + (j+1) * charCellWidth,	// x2
								thisLineYUpLeft + charLineHeight);	// y2
							// "⭷" left bottom --> right top
							doc.line(
								xUpLeft + j * charCellWidth,		// x1
								thisLineYUpLeft + charLineHeight,	// y1
								xUpLeft + (j+1) * charCellWidth,	// x2
								thisLineYUpLeft);					// y2
							doc.setLineCap("projecting");
						doc.setLineDash();
						doc.setDrawColor("000000");
					}
				// vertical lines
				doc.line(xUpLeft + j * charCellWidth, thisLineYUpLeft, xUpLeft + j * charCellWidth, thisLineYUpLeft + charLineHeight);
				// write first char (j=0) and grey chars (j=1,...,11)
				if(j == 1) doc.setTextColor("#D0D0D0");  // set color to grey, so the supporting characters will be in grey
				if(j == 11) doc.setTextColor("#000000"); // reset color to black
				if(j <= numberOfGrayscaleSigns){ // it's either the first, black sign (j==0) or one of the grayscale signs (j=1,2,...,numberOfGrayscaleSigns)
					doc.text(characters[i], xUpLeft + (j + 0.5) * charCellWidth, thisLineYUpLeft + charLineHeight - 3, 'center');
				}
			};
			// upper line
			doc.line(xUpLeft, thisLineYUpLeft, xUpLeft + 11 * charCellWidth, thisLineYUpLeft);
			// lower line
			doc.line(xUpLeft, thisLineYUpLeft + charLineHeight, xUpLeft + 11 * charCellWidth, thisLineYUpLeft + charLineHeight);
			$(".amountDone").html(i);
		};

	// return doc
		if(wayOfRetrieval == "window")
			doc.output('dataurlnewwindow');
		else if(wayOfRetrieval == "currentWindow")
			doc.output('datauri');
		else
			doc.save(filename + '.pdf');
		$("#statusTr").removeClass("processing");
		$("#mainstatus").html('PDF created.');
		$("#substatus").html('<a href="index.html">Start from the beginning for a new worksheet!</a><br/>(You can also press F5 in order to keep the values you entered in the form.)');
		// TODO: This timeout above makes it work: Without it, the document was created before the stroke orders were drawn. Anyways, this is just a very dirty trick -- it should be done with callbacks somehow!
}
