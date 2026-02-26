document.addEventListener('DOMContentLoaded', () => {
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
    const wordsToExtract = ["woman's", "comfort", "men's", "barefoot"];

        return title.toLowerCase()
            .split(" ")
            .filter(word => wordsToExtract.includes(word))
            .join(" ") + " shoes";
    }

    const getProductListingData = (item) => {
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
            console.log("Error parsing product listing data: ", error)
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
        const promotions = document.querySelectorAll('.hero__image-wrapper[type="select_promotion"]');
        let promotionData = []

        promotions.forEach(promotion => {
            promotionData.push(getPromotionData(promotion))
        })

        const homepageData = {
            customData: promotionData
        }
        Shopify.analytics.publish(homepagePromotionView, homepageData);

        // HOMEPAGE PROMOTION CLICK
        const promotionButtons = document.querySelectorAll('.btn.promotion-button')
        promotionButtons.forEach(button => {
            button.addEventListener('click', () => {
                const homepagePromotionClick = "select_promotion"
                let promotionClickData = getPromotionData(button)

                const homepagePromottionClickData = {
                    customData: promotionClickData
                }
                Shopify.analytics.publish(homepagePromotionClick, homepagePromottionClickData);
            })
        })
    }


    // HOMEPAGE & COLLECTION PRODUCT LISTING VIEW, COLLECTION ITEM CLICK
    if (template === 'homepage' || template === 'collection') {
        const homepage_product_listing = 'view_item_list'
        let listItemsData = []

        if (template === 'homepage') {
            const listItems = document.querySelectorAll('.analytics-item[type="view_item_list"]')
            listItems.forEach(item => {
                listItemsData.push(getProductListingData(item, template))


                // HOMEPAGE COLLECTION ITEM CLICK
                // item.addEventListener('click', () => {
                //     const itemClick = "select_item"
                //     let itemClickData = getProductListingData(item, template)

                //     const collectionItemClickData = {
                //         customData: itemClickData
                //     }
                //     console.log("homepage collection item click data: ", collectionItemClickData)

                //     Shopify.analytics.publish(itemClick, collectionItemClickData);
                // })
            })

        } else if (template === 'collection') {
            const listItems = document.querySelectorAll('.analytics-item[type="view_item_list"]')
            listItems.forEach(item => {
                listItemsData.push(getProductListingData(item, template))

                // COLLECTION ITEM CLICK
                item.addEventListener('click', () => {
                    const itemClick = "select_item"
                    let itemClickData = getProductListingData(item, template)

                    const collectionItemClickData = {
                        customData: itemClickData
                    }
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



    //  POP UP FOR ARTICLE AND NON AFFILIATE CUSTOMERS
    const searchParams = new URLSearchParams(window.location.search)
    const affiliate = searchParams.has('utm_medium=affiliate')

    const path = window.location.pathname
    const isArticle = path.includes('blogs/news/')

    if (isArticle && !affiliate) {
        (function (w,d,s,o,f,js,fjs) {
            w['ecm-widget']=o;w[o] = w[o] || function () { (w[o].q = w[o].q || []).push(arguments) };
            js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
            js.id = '16-008646c414ce6adc8637fedebcbf087a'; js.dataset.a = 'ahinsashoescom'; js.src = f; js.async = 1; fjs.parentNode.insertBefore(js, fjs);
        }(window, document, 'script', 'ecmwidget', 'https://d70shl7vidtft.cloudfront.net/widget.js'));
    } else {
        (function (w,d,s,o,f,js,fjs) {
          w['ecm-widget']=o;w[o] = w[o] || function () { (w[o].q = w[o].q || []).push(arguments) };
          js = d.createElement(s), fjs = d.getElementsByTagName(s)[0];
          js.id = '4-f67e22c6c3dacfc9b77b6b40399abc16'; js.dataset.a = 'ahinsashoescom'; js.src = f; js.async = 1; fjs.parentNode.insertBefore(js, fjs);
      }(window, document, 'script', 'ecmwidget', 'https://d70shl7vidtft.cloudfront.net/widget.js'));
    }
});

