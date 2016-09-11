
var three = function (context) {
	var div = document.createElement ('div');
	div.setAttribute ('class', 'three');

	var first = one ();
	var second = two ();

	document.body.appendChild (first);
	first.appendChild (second);
	second.appendChild (div);

	var changedStr = context.template ( 
		[
			'<div name="{{getName (values)}}">',
				'{{test_text}}',
				'<ol>',
				'<ctx for="list_values">',
					'<li>',
						'{{.}}',	
					'</li>',
				'</ctx>',
				'</ol>',
			'</div>'

		].join (' '),
		{
			test_text: 'Hello, World!',
	    		list_values: [
				'one',
	    			'two',
	    			'three'
			],
			getName: function (values) {
				return values.test_text;
			}
		}
	);

	div.innerHTML = changedStr;
}



