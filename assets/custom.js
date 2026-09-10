jQuery_T4NT(document).ready(function ($) {
	/**
	*  Variant selection changed
	*  data-variant-toggle="{{ variant.id }}"
	*/

	// =============================== 
	// CUSTOM EVENTS - PRESALE FUNCTIONALITY
	
	// Function to create and dispatch the custom event
	const dispatchNewVariantChangedEvent = (selectedOption) => {
		const newVariantEvent = new CustomEvent('newVariant:changed', {
			detail: {
				variantId: selectedOption.val(),
				variantSku: selectedOption.data('sku'),
				mediaId: selectedOption.data('mdid'),
				incoming: selectedOption.data('incoming'),
				inventoryQuantity: selectedOption.data('inventoryquantity'),
				inventoryPolicy: selectedOption.data('inventorypolicy') === 'deny' ? false : true,
				nextIncomingDate: selectedOption.data('nextincomingdate'),
				preorderLimit: selectedOption.data('preorderlimit')
			}
		});
		document.dispatchEvent(newVariantEvent);
	};

	// Listen for changes on the select element
	$('select.t4s-product__select').on('change', function () {
		const $selectedOption = $(this).find('option:selected');
		dispatchNewVariantChangedEvent($selectedOption);
	});

	//Update varint ID in url on first load 
	const updateVariantUrl = (key, value) => {
		// Get the current URL
		let url = new URL(window.location.href);

		// Update the query parameter
		url.searchParams.set(key, value);

		// Update the URL in the browser without reloading the page
		history.replaceState(null, '', url.toString());
	}

	// TODO - Load entire data on page load and then work with this 
	const callStoreData = (variant) => {
		// Code for available in the store 
		$.ajax({
			type: "get",
			url: "https://walkfree.cz/feed/feed-londynska.xml",
			dataType: "xml",
			success: function (e) {
				e.querySelectorAll("sklad_praha polozka").forEach((e) => {
					e.querySelector("sku").textContent === variant.variantSku
						&& (parseInt(e.querySelector("pocet_ks").textContent, 10) > 0
							?
							($('[data-stock="inStore"]').show(0),
								$('[data-stock="inStore"]').css('display', 'inline'))
							:
							($('[data-stock="inStore"]').hide(0),
								$('[data-stock="inStore"]').css('display', 'none')))
				});
			},
			error: function (e, t) {
				console.log("error: ", t);
			},
		});

	}

	const showStockData = (variant) => {
		const inventory = parseInt(variant.inventoryQuantity)
		let preorderLimit = parseInt(variant.preorderLimit)
		const policy = variant.inventoryPolicy


		if (isNaN(preorderLimit)) {
			preorderLimit = DEF_PREORDER_LIMIT
		}

		callStoreData(variant)

		if (policy && inventory <= 0 && inventory > preorderLimit) {
			$('[data-stock="preOrder"]').show(0);
			$('[data-stock="preOrder"]').css('display', 'inline');
			updateCartBtn('preorder')

			// hide a watchdog btn 
			$watchDog.hide()
		}
		else if ((!policy && inventory <= 0) || preorderLimit == inventory) {
			$('[data-stock="outOfStock"]').show(0);
			$('[data-stock="outOfStock"]').css('display', 'inline');
			updateCartBtn('outofstock')
			$watchDog.show().attr('data-variant-id', variant.variantId)
		}

		else if (inventory < 5 && inventory > 0) {
			$('[data-stock="lowStock"]').show(0);
			$('[data-stock="lowStock"]').css('display', 'inline');
			updateCartBtn('instock')
			// hide a watchdog btn 
			$watchDog.hide()
		}

		else if (inventory >= 5) {
			$('[data-stock="inStock"]').show(0);
			$('[data-stock="inStock"]').css('display', 'inline');
			updateCartBtn('instock')
			// hide a watchdog btn 
			$watchDog.hide()
		}
	}

	const updateCartBtn = (status) => {
		const addToCartBtn = $('#AddToCart')
		const addToCartStickyBtn = $('#AddToCartSticky')
		const text = addToCartBtn.data(status)
		addToCartBtn.find('span').text(text);
		addToCartStickyBtn.find('span').text(text);
		if (status === 'outofstock') {
			addToCartBtn.attr('disabled', 'disabled').attr('aria-disabled', 'true');
			addToCartStickyBtn.attr('disabled', 'disabled').attr('aria-disabled', 'true');
		}
		else {
			addToCartBtn.removeAttr('disabled').removeAttr('aria-disabled');
			addToCartStickyBtn.removeAttr('disabled').removeAttr('aria-disabled');
		}
	}

	const stockInit = (variant) => {
		$('[data-stock]').hide(0);
		$('[data-stock]').css('display', 'none');
		$('[data-available-status]').css('display', 'inline')

		showStockData(variant)
	}

	// SELECT DATA ON LOAD
	const $variantSelect = $('.t4s-product__select')
	const $template = $('[data-template]').data('template')
	const $watchDog = $('#BIS_trigger')
	const DEF_PREORDER_LIMIT = -999


	// call store availibility on the page load
	// callStoreData()

	// Goes through variants and pick the one that should be selected
	// Basically finds the selected variant
	if ($variantSelect.length && $template != 'gift-card') {

		let variantSelected = false
		$variantSelect.find('option').each(function () {
			const $option = $(this);
			const $uiOptions = $('.custom.t4s-swatch__item')

			const variant = {
				variantId: $option.val(),
				variantSku: $option.data('sku'),
				mediaId: $option.data('mdid'),
				incoming: $option.data('incoming'),
				inventoryQuantity: $option.data('inventoryquantity'),
				inventoryPolicy: $option.data('inventorypolicy') === 'deny' ? false : true,
				nextIncomingDate: $option.data('nextincomingdate'),
				preorderLimit: $option.data('preorderlimit'),
				option: $option.data('option'),
			}

			let preorderLimit = variant.preorderLimit

			//Find variant that is selected in UI representation on page and it is the same as realy selected in the background
			const $matchingElement = $uiOptions.filter((index, element) => {
				return $(element).data('value') == variant.option;
			});

			if (typeof preorderLimit === 'string') {
				preorderLimit = DEF_PREORDER_LIMIT
			}

			if ((variant.inventoryPolicy && variant.inventoryQuantity > preorderLimit) || variant.inventoryQuantity > 0) {
				if (!variantSelected) {
					$option.attr('selected', 'selected');

					$matchingElement.addClass('is--selected')
					$matchingElement.removeClass('is--soldout');
					//update url to selected variant 
					updateVariantUrl('variant', variant.variantId)

					variantSelected = true
				}
			}
			else {
				$matchingElement.removeClass('is--selected');
				$matchingElement.addClass('is--soldout')

			}
		});
		if (variantSelected) {
			// FInds the selected variant and pull data out of it
			const currentVariant = $variantSelect.find('[selected="selected"]')
			// VARIANT DATA OBJECT TO PASS ON
			const variant = {
				variantId: currentVariant.val(),
				variantSku: currentVariant.data('sku'),
				mediaId: currentVariant.data('mdid'),
				incoming: currentVariant.data('incoming'),
				inventoryQuantity: currentVariant.data('inventoryquantity'),
				inventoryPolicy: currentVariant.data('inventorypolicy') === 'deny' ? false : true,
				nextIncomingDate: currentVariant.data('nextincomingdate'),
				preorderLimit: currentVariant.data('preorderlimit')
			}
			stockInit(variant)
		} else {
			const variant = {
				inventoryQuantity: 0,
				inventoryPolicy: false,
			}
			stockInit(variant)
		}

		// Listen for the custom event
		document.addEventListener('newVariant:changed', (event) => {
			const variant = event.detail;

			$('[data-stock]').hide(0);
			$('[data-stock]').css('display', 'none');
			$('[data-available-status]').css('display', 'inline')

			showStockData(variant)
		});

	} else {
		const productId = $('input[name="product-id"]').val();
		const inventory = parseInt($('#AddToCart').data('inventory'));

		if (inventory <= 0) {
			$watchDog.show().attr('data-variant-id', productId)
		}

	}

	// =============================== 
	// DATA ANALYTICS, CUSTOM EVENTS, HOMEPAGE PROMOTION, COLLECTION PAGE, COLLECTION ITEM CLICK 
	let template = null
	const templateClass = document.querySelector('body').classList

	if (templateClass.contains('template-collection')) {
		template = 'collection'
	} else if (templateClass.contains('template-index')) {
		template = 'homepage'
	}
	else {
		console.log("template not found")
	}

	// Extract category from title, there is not category in the data from Shopify
	const extractCategory = (title) => {
		const wordsToExtract = ["dámské", "comfort", "pánské", "barefoot", "women's", "women’s", "womens", "men's", "men’s", "mens"];
		return title.toLowerCase()
			.split(" ")
			.filter(word => wordsToExtract.includes(word))
			.join(" ") + " shoes";
	}

	const getProductListingData = (item, template) => {
		try {
			const value = item.getAttribute('value')
			const parseData = JSON.parse(value)
			const category = extractCategory(parseData.title)

			const data = {
				item_id: parseData.id,
				item_name: parseData.title,
				item_category: category,
				item_list_name: parseData.item_list_name, //different for homepage and collection
				price: parseData.price,
				index: parseData.index,
			}
			return data
		} catch (error) {
			return error
		}


	}

	const getPromotionData = (promotion) => {
		try {
			const value = promotion.getAttribute('value')
			const parseData = JSON.parse(value)
			const data = {
				promotion_id: parseData.promotion_id,
				promotion_name: parseData.promotion_name,
				creative_name: parseData.creative_name,
				location_id: parseData.location_id
			}
			return data
		} catch (error) {
			console.log("Error parsing promotion data: ", error)
			return error
		}
	}

	// const getEbookData = (ebook) => {
	// 	try {
	// 		const value = ebook.getAttribute('value')
	// 		const parseData = JSON.parse(value)
	// 		const data = {
	// 			item_name: parseData.item_name,
	// 			item_id: parseData.item_id
	// 		}
	// 		return data
	// 	} catch (error) {
	// 		console.log("Error parsing ebook data: ", error)
	// 		return error
	// 	}
	// }
	// HOMEPAGE PROMOTION VIEW
	if (template === 'homepage') {
		const homepagePromotionView = 'homepage_promotion_view';
		const promotions = document.querySelectorAll('[type="select_promotion"]');
		let promotionData = []

		promotions.forEach(promotion => {
			promotionData.push(getPromotionData(promotion))

			// HOMEPAGE PROMOTION CLICK
			promotion.addEventListener('click', () => {
				const homepagePromotionClick = "select_promotion"
				let promotionClickData = getPromotionData(promotion)

				const homepagePromottionClickData = {
					customData: promotionClickData
				}
				Shopify.analytics.publish(homepagePromotionClick, homepagePromottionClickData);
			})
		})

		const homepageData = {
			customData: promotionData
		}
		Shopify.analytics.publish(homepagePromotionView, homepageData);
	}


	// HOMEPAGE & COLLECTION PRODUCT LISTING VIEW, COLLECTION ITEM CLICK
	if (template === 'homepage' || template === 'collection') {
		const homepage_product_listing = 'view_item_list'
		let listItemsData = []

		if (template === 'homepage') {
			const listItems = document.querySelectorAll('.homepage-product-listing [type="view_item_list"]')
			listItems.forEach(item => {
				listItemsData.push(getProductListingData(item, template))
			})

		} else if (template === 'collection') {
			const listItems = document.querySelectorAll('.collection-listing [type="view_item_list"]')
			// console.log("list items: ", listItems)
			listItems.forEach(item => {
				listItemsData.push(getProductListingData(item, template))
	
				// COLLECTION ITEM CLICK
				item.addEventListener('click', () => {
					const itemClick = "select_item"
					let itemClickData = getProductListingData(item, template)
	
					const collectionItemClickData = {
						customData: itemClickData
					}
					console.log("collection item click data: ", collectionItemClickData)
	
					Shopify.analytics.publish(itemClick, collectionItemClickData);
				})
			})


		}

		const productListingData = {
			customData: listItemsData
		}

		Shopify.analytics.publish(homepage_product_listing, productListingData);
	}

	// E-BOOK DOWNLOAD
	// item_name: "Ultimate Guide to Barefoot Running",
	// item_id: "ebook1234"
	// const ebookDownload = 'ebook_download'

	// const ebooks = document.querySelectorAll('.ebook-download')

	// ebooks.forEach(ebook => {
	// 	ebook.addEventListener('click', () => {
	// 		let ebookData = getEbookData(ebook)
	// 		const ebookDownloadData = {
	// 			customData: data
	// 		}

	// 		Shopify.analytics.publish(ebookDownload, ebookDownloadData);
	// 	})		
	// })

	// =============================== 
	// CUSTOM REAL-TIME FILTERING - COLLECTION PAGE 

	// get section ID 
	const sectionIdElement = document.querySelector ('[data-ntajax-options]')
	const sectionId = parseJsonData(sectionIdElement.dataset.ntajaxOptions)
	// select the top head filter 
	const topHeadFilters = document.querySelectorAll ('.size-filtering div')
	// add event listeners to each 
	// deal with race condition
	let pendingUrl = new URL (window.location.href)
	topHeadFilters.forEach(a => {
		a.addEventListener('click', (e) => {
			e.preventDefault()
			// add new search params to the URL

			pendingUrl.searchParams.append('filter.v.option.velikost', a.dataset.size)
			const fetchUrl = new URL (pendingUrl)
			fetchUrl.searchParams.append('sections', sectionId)

			filterCollection(fetchUrl)
		})
	})

	// clear pending URL when cleaning active filters 
	const cleanFilterBtn = document.querySelector ('.t4s-active-filters__clear') 
	cleanFilterBtn.addEventListener('click', () => {
		clearPendingUrl()
	})
	function filterCollection (fetchUrl) {
		//call API to fetch filtered collection section

		const doFetch = () => {
			return fetch(fetchUrl)
			.then (response => response.json())
			.then (data => {
				const html = data[sectionId]
				updateDOM(html)
			})
			.catch (error => console.error('Error fetching collection: ', error))
		}

		const updateDOM = (html) => {
			const parser = new DOMParser()
			const doc = parser.parseFromString(html, 'text/html')
			const data = doc.querySelector('#shopify-section-' + sectionId)
			console.log('data: ', data)
			// Update products
			const updatedSection = doc.querySelector('.t4s_box_pr_grid')
			// Update pagination 
			const updatedFooter = doc.querySelector('.t4s-prs-footer')
			console.log('updatedFooter: ', updatedFooter)

			// Update filters active filters
			const updatedActiveFilters = doc.querySelector('.t4s-active-filters')
			
			// change to update data - get at least somehting back, than check for each section I want to update
			if (updatedSection) {
				// Produt grid update
				const oldSection = document.querySelector('#shopify-section-' + sectionId + ' .t4s_box_pr_grid')
				oldSection.innerHTML = updatedSection.innerHTML
				// Update pagination 
				// If exists update 
				// If doesn't exist in new data, hide the old one
				const oldFooter = document.querySelector('#shopify-section-' + sectionId + ' .t4s-prs-footer')
				console.log('oldFooter: ', oldFooter)
				if (updatedFooter && oldFooter) {
					oldFooter.innerHTML = updatedFooter.innerHTML
				} else if (updatedFooter && !oldFooter) {
					sectionIdElement.append (updatedFooter)
				} else if (oldFooter) {
					oldFooter.remove()
				}
				// Update active filters
				const oldActiveFilters = document.querySelector('#shopify-section-' + sectionId + ' .t4s-active-filters')
				if (updatedActiveFilters && oldActiveFilters) {
					oldActiveFilters.innerHTML = updatedActiveFilters.innerHTML
				} else if (updatedActiveFilters && !oldActiveFilters) {
					sectionIdElement.prepend (updatedActiveFilters)
				} else if (oldActiveFilters) {
					oldActiveFilters.remove()
				}
				// Update URL 
				history.pushState({}, '', pendingUrl.toString());
			}
		}
		if (document.startViewTransition) {
			document.startViewTransition(() => doFetch())
		}
		else {
			doFetch()
		}
	}

	// Helper functions 
	function parseJsonData (data) {
		if (data) {
			try {
				const jsonData = JSON.parse(data)
				console.log (jsonData)
				return jsonData.id
			} catch (err) {
				console.log(data)
				return data
			}
		}
		console.error('There is no data to parse')
		return null 
	}

	// clear pending URL when cleaning active filters 
	function clearPendingUrl () {
		pendingUrl = new URL (window.location.origin + window.location.pathname)
	}
	// on click call function with API 
		// pass URL, search params, add new search params, fetch collection section 
		// update filter highlighting the elements according to new data 
		// show product count 
		// update active filters

	
});
