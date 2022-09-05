import './map.html';
import './styles.css';
let clusterer;
document.addEventListener('DOMContentLoaded', () => ymaps.ready(init));

function init() {
    const myMap = new ymaps.Map("map", {
        center: [55.76, 37.64],
        controls: ['zoomControl'],
        zoom: 10
    });

    myMap.events.add('click', function(e) {
        const coords = e.get('coords');
        openBalloon(myMap, coords, []);
    });

    clusterer = new ymaps.Clusterer({clusterDisableClickZoom: true});
    clusterer.options.set('hasBalloon', false);
    renderGeoObjects(myMap);
    
    clusterer.events.add('click', function(e) {
        let geoObjectsInCluster = e.get('target').getGeoObjects();
        openBalloon(myMap, e.get('coords'), geoObjectsInCluster);
    });
};

function getReviewsFromLS() {
    const reviews = localStorage.reviews;
    return JSON.parse(reviews || '[]');
};

function getReviewList(currentGeoObjects) {
    let reviewListHTML = '';

    for (const review of getReviewsFromLS()) {
        if (currentGeoObjects.some(geoObject => JSON.stringify(geoObject.geometry._coordinates) === JSON.stringify(review.coords))) {
            reviewListHTML += `
            <div class="review">
                <div>${review.author}</div>
                <div>${review.place}</div>
                <div>${review.reviewText}</div>
            </div>
            `
        };
    };
    
    return reviewListHTML;
};

function renderGeoObjects(map) {
    const geoObjects = [];

    for (const review of getReviewsFromLS()) {
        const placemark = new ymaps.Placemark(review.coords);
        
        placemark.events.add('click', e => {
            e.stopPropagation();
            openBalloon(map, review.coords, [e.get('target')]);
        });

        geoObjects.push(placemark);
    };
    
    clusterer.removeAll();
    map.geoObjects.remove(clusterer);
    clusterer.add(geoObjects);
    map.geoObjects.add(clusterer);
};

async function openBalloon(map, coords, currentGeoObjects) {
    await map.balloon.open(coords, {
        content: `
        <div class="reviews">${getReviewList(currentGeoObjects)}</div>
        <form id="add-form">
            <div><strong>Отзыв: </strong></div>
            <input type="text" placeholder="Укажите ваше имя" name="author"><br><br>
            <input type="text" placeholder="Укажите место" name="place"><br><br>
            <textarea placeholder="Оставить отзыв" name="review"></textarea><br><br>
            <button id="add-btn" class="button">Добавить</button><br>
        </form>
        `
    });

    document.querySelector('#add-form').addEventListener('submit', function(e) {
        e.preventDefault();
        
        const review = {
            coords,
            author: this.elements.author.value,
            place: this.elements.place.value,
            reviewText: this.elements.review.value,
        };

        localStorage.reviews = JSON.stringify([...getReviewsFromLS(), review]);
        renderGeoObjects(map);
        map.balloon.close();
    });
};