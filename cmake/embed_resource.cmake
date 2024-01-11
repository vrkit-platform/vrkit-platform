
function(EMBED_RESOURCE resFile outputSourceFile varName)
  add_custom_command(
    OUTPUT ${outputSourceFile}
    DEPENDS ${resFile}
    PRE_BUILD
    COMMAND python
    ARGS ${CMAKE_SOURCE_DIR}/scripts/embed_resource.py -o ${outputSourceFile} ${varName} ${resFile}
    VERBATIM
  )

#  target_sources(${targetName} PRIVATE ${outputSourceFile})
endfunction()