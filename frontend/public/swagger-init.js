window.addEventListener('load', () => {
    if (typeof window.SwaggerUIBundle !== 'function') {
      document.getElementById('swagger-ui').textContent = 'Не удалось загрузить Swagger UI. Попробуйте обновить страницу или скачайте OpenAPI JSON по ссылке выше.'
      return
    }
    window.ui = window.SwaggerUIBundle({
      url: '/openapi.json',
      dom_id: '#swagger-ui',
      deepLinking: true,
      validatorUrl: null,
      persistAuthorization: false,
      presets: [window.SwaggerUIBundle.presets.apis],
      layout: 'BaseLayout',
    })
  })
  