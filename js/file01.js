"use strict";
// Importar las funciones desde functions.js
import { fetchProducts, fetchCategories } from './functions.js';
import { saveVote, getVotes } from './firebase.js';
const showToast = () => {
    const toast = document.getElementById("toast-interactive");
    if (toast) {
        toast.classList.add("md:block");
    }
};
const showVideo = () => {
    const demo = document.getElementById("demo");
    if (demo) {
        demo.addEventListener("click", () => {
            window.open("https://www.youtube.com/watch?v=dQw4w9WgXcQ", "_blank");
        });
    }
};
/**
 * Renderiza los productos en el contenedor correspondiente.
 * Obtiene los productos de la API, procesa los primeros 6 y los muestra
 * en formato de tarjetas con información relevante.
 * 
 * @function renderProducts
 * @returns {void}
 */
let renderProducts = () => {
    fetchProducts("https://data-dawm.github.io/datum/reseller/products.json")
        .then(result => {
            if (result.success) {
                let container = document.getElementById("products-container");
                container.innerHTML = '';
                let products = result.body.slice(0, 6);
                products.forEach(product => {
                    let productHTML = `
   <div class="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow">
       <img
           class="w-full h-40 bg-gray-300 dark:bg-gray-700 rounded-lg object-cover transition-transform duration-300 hover:scale-[1.03]"
           src="[PRODUCT.IMGURL]" alt="[PRODUCT.TITLE]">
       <h3
           class="h-6 text-xl font-semibold tracking-tight text-gray-900 dark:text-white hover:text-black-600 dark:hover:text-white-400">
           $[PRODUCT.PRICE]
       </h3>

       <div class="h-5 rounded w-full">[PRODUCT.TITLE]</div>
           <div class="space-y-2">
               <a href="[PRODUCT.PRODUCTURL]" target="_blank" rel="noopener noreferrer"
               class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 w-full inline-block">
                   Ver en Amazon
               </a>
               <div class="hidden"><span class="1">[PRODUCT.CATEGORY_ID]</span></div>
           </div>
       </div>
   </div>`;
                    productHTML = productHTML.replaceAll("[PRODUCT.TITLE]", product.title.length > 20 ? product.title.substring(0, 20) + "..." : product.title);
                    productHTML = productHTML.replaceAll("[PRODUCT.PRICE]", product.price);
                    productHTML = productHTML.replaceAll("[PRODUCT.IMGURL]", product.imgUrl);
                    productHTML = productHTML.replaceAll("[PRODUCT.PRODUCTURL]", product.productURL);
                    productHTML = productHTML.replaceAll("[PRODUCT.CATEGORY_ID]", product.category_id);
                    container.innerHTML += productHTML;
                });

            }
            else {
                throw new Error("Error en fetchProducts:");
            }
        })
        .catch(error => {
            console.error("Error en fetchProducts:");
        });
}

export { renderProducts }
/**
 * Renderiza las categorías en el elemento select correspondiente.
 * Obtiene las categorías desde un archivo XML, procesa la información
 * y genera las opciones del dropdown.
 * 
 * @async
 * @function renderCategories
 * @returns {Promise<void>}
 */
let renderCategories = async () => {
    try {
        let result = await fetchCategories('https://data-dawm.github.io/datum/reseller/categories.xml');

        if (result.success) {
            let container = document.getElementById("categories");
            container.innerHTML = `<option selected disabled>Seleccione una categoría</option>`;

            let categoriesXML = result.body;
            let categories = categoriesXML.getElementsByTagName('category');

            for (let category of categories) {
                let id = category.getElementsByTagName('id')[0].textContent;
                let name = category.getElementsByTagName('name')[0].textContent;

                let categoryHTML = `<option value="${id}">${name}</option>`;
                container.innerHTML += categoryHTML;
            }
        }
        else {
            alert("Error en la carga de categorías");
        }
    } catch (error) {
        alert('Error al cargar categorías: ' + error.message);
    }
}
/**
 * Función de autoejecución que inicializa la aplicación.
 * Llama a las funciones de renderizado de productos y categorías.
 * 
 * @function
 * @returns {void}
 */
let enableForm = () => {
    const form = document.getElementById("form_voting");
    if (form) {
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const productId = document.getElementById("select_product").value;
            saveVote(productId)
                .then(response => {
                    if (response.status) {
                        alert(response.message);
                    }
                    else {
                        alert(response.message);
                    }
                });
        });
    }
}
let displayVotes = async () => {
    try {
        const votesResult = await getVotes();
        if (votesResult.status) {
            const votes = votesResult.data;
            const resultsContainer = document.getElementById('results');
            let tableHTML = `
    <table class="min-w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-500">
        <thead>
            <tr class="bg-gray-100 dark:bg-gray-600">
                <th class="py-2 px-4 border-b border-gray-300 dark:border-gray-500 text-left text-gray-900 dark:text-white">Producto Votado</th>
                <th class="py-2 px-4 border-b border-gray-300 dark:border-gray-500 text-left text-gray-900 dark:text-white">Total de Votos</th>
            </tr>
        </thead>
        <tbody>
`;
            const voteCount = {};
            Object.values(votes).forEach(vote => {
                const productId = vote.productId;
                voteCount[productId] = (voteCount[productId] || 0) + 1;
            });
            Object.entries(voteCount).forEach(([productId, count]) => {
                tableHTML += `
    <tr class="hover:bg-gray-50 dark:hover:bg-gray-600">
        <td class="py-2 px-4 border-b border-gray-300 dark:border-gray-500 text-gray-800 dark:text-gray-200">Producto ${productId}</td>
        <td class="py-2 px-4 border-b border-gray-300 dark:border-gray-500 text-gray-800 dark:text-gray-200">${count}</td>
    </tr>
`;
            });

            tableHTML += `
                    </tbody>
                </table>
            `;

            resultsContainer.innerHTML = tableHTML;
        }
        else {
            document.getElementById('results').innerHTML = '<p>No hay votos registrados</p>';
        }
    }
    catch (error) {
        console.error('Error al mostrar votos:', error);
        document.getElementById('results').innerHTML = '<p>Error al cargar los votos</p>';
    }
}
(() => {
    showToast();
    showVideo();
    renderProducts();
    renderCategories();
    enableForm();
    displayVotes();
})();
